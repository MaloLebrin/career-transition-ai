import ErrorTrackingTest, { ERROR_TRACKING_TEST_MESSAGE } from '#commands/error_tracking_test'
import {
  QUEUE_EXECUTE_CHANNEL,
  initErrorTracking,
  isErrorTrackingEnabled,
  reportError,
  scrubEvent,
  setErrorReporter,
  watchQueueFailures,
  type ErrorContext,
  type ErrorReporter,
} from '#services/error_tracking_service'
import ace from '@adonisjs/core/services/ace'
import * as Sentry from '@sentry/node'
import type { ErrorEvent } from '@sentry/node'
import { test } from '@japa/runner'
import diagnostics_channel from 'node:diagnostics_channel'

/** Rapporteur de test : garde les erreurs au lieu de les envoyer. */
function fakeReporter() {
  const captured: { error: unknown; context: ErrorContext }[] = []
  const reporter: ErrorReporter = { capture: (error, context) => captured.push({ error, context }) }
  return { reporter, captured }
}

test.group('error_tracking_service | reportError', (group) => {
  group.each.teardown(() => {
    setErrorReporter(null)
  })

  test('sans rapporteur (pas de DSN), ne fait rien', ({ assert }) => {
    assert.doesNotThrow(() => reportError(new Error('boom')))
  })

  test('transmet erreur et contexte au rapporteur actif', ({ assert }) => {
    const { reporter, captured } = fakeReporter()
    setErrorReporter(reporter)
    const error = new Error('boom')

    reportError(error, { userId: 7, tags: { route: '/x' } })

    assert.lengthOf(captured, 1)
    assert.strictEqual(captured[0].error, error)
    assert.deepEqual(captured[0].context, { userId: 7, tags: { route: '/x' } })
  })

  test('une panne du rapporteur ne remonte jamais', ({ assert }) => {
    setErrorReporter({
      capture: () => {
        throw new Error('Sentry indisponible')
      },
    })

    assert.doesNotThrow(() => reportError(new Error('boom')))
  })

  test("sans DSN, initErrorTracking n'active rien", ({ assert }) => {
    assert.isFalse(initErrorTracking({ dsn: undefined }))
    const { captured } = fakeReporter()
    reportError(new Error('boom'))
    assert.lengthOf(captured, 0)
  })
})

test.group('error_tracking_service | scrubEvent', () => {
  test("réduit l'utilisateur à son id et retire cookies, corps et query string", ({ assert }) => {
    const event = scrubEvent({
      type: undefined,
      user: { id: '42', email: 'jeanne@example.com', username: 'Jeanne', ip_address: '1.2.3.4' },
      request: {
        method: 'POST',
        url: 'https://app.example.com/dashboard/employees?email=jeanne@example.com',
        query_string: 'email=jeanne@example.com',
        cookies: { session: 'secret' },
        data: { name: 'Jeanne Martin' },
        headers: {
          'User-Agent': 'Mozilla',
          'Cookie': 'session=secret',
          'X-Forwarded-For': '1.2.3.4',
          'Authorization': 'Bearer x',
        },
      },
    } as ErrorEvent)

    assert.deepEqual(event.user, { id: '42' })
    assert.deepEqual(event.request, {
      method: 'POST',
      url: 'https://app.example.com/dashboard/employees',
      headers: { 'User-Agent': 'Mozilla' },
    })
  })

  test('supprime un utilisateur sans id (IP seule)', ({ assert }) => {
    const event = scrubEvent({ type: undefined, user: { ip_address: '1.2.3.4' } } as ErrorEvent)
    assert.isUndefined(event.user)
  })
})

test.group('error_tracking_service | Sentry', (group) => {
  group.teardown(async () => {
    setErrorReporter(null)
    await Sentry.close()
  })

  test("envoie la stack, l'id de l'utilisateur et les tags, rien d'identifiant", async ({
    assert,
  }) => {
    const events: ErrorEvent[] = []
    const enabled = initErrorTracking(
      { dsn: 'https://public@o0.ingest.sentry.io/0', environment: 'test', release: 'abc123' },
      {
        // Pas d'intégrations globales (uncaughtException…) dans le process de test,
        // et rien ne part sur le réseau : l'événement nettoyé est gardé ici.
        defaultIntegrations: false,
        beforeSend: (event) => {
          events.push(scrubEvent(event))
          return null
        },
      }
    )
    assert.isTrue(enabled)

    reportError(new Error('Mistral indisponible'), {
      userId: 42,
      tags: { route: '/dashboard/employees/:id' },
      extra: { status: 500 },
    })
    await Sentry.flush(1000)

    assert.lengthOf(events, 1)
    const [event] = events
    assert.equal(event.exception?.values?.[0].value, 'Mistral indisponible')
    assert.isAbove(event.exception?.values?.[0].stacktrace?.frames?.length ?? 0, 0)
    assert.deepEqual(event.user, { id: '42' })
    assert.equal(event.tags?.route, '/dashboard/employees/:id')
    assert.equal(event.environment, 'test')
    assert.equal(event.release, 'abc123')
  })
})

test.group('error_tracking_service | watchQueueFailures', (group) => {
  group.each.teardown(() => {
    setErrorReporter(null)
  })

  /** Simule une exécution de job telle que la publie le worker `@boringnode/queue`. */
  function runJob(status: string, error?: Error) {
    const message: Record<string, unknown> = {
      job: {
        id: 'job-1',
        name: 'AnalyzeExerciseQualitativeJob',
        attempts: 3,
        payload: { secret: 1 },
      },
      queue: 'ai',
    }
    return diagnostics_channel.tracingChannel(QUEUE_EXECUTE_CHANNEL).tracePromise(async () => {
      message.status = status
      message.error = error
    }, message)
  }

  test('signale un job en échec définitif, sans son payload', async ({ assert }) => {
    const { reporter, captured } = fakeReporter()
    setErrorReporter(reporter)
    const unwatch = watchQueueFailures()
    const error = new Error('boom')

    await runJob('failed', error)
    unwatch()

    assert.lengthOf(captured, 1)
    assert.strictEqual(captured[0].error, error)
    assert.deepEqual(captured[0].context, {
      tags: { queue: 'ai', job: 'AnalyzeExerciseQualitativeJob' },
      extra: { jobId: 'job-1', attempts: 3 },
    })
  })

  test('ignore les jobs réussis et les tentatives rejouées', async ({ assert }) => {
    const { reporter, captured } = fakeReporter()
    setErrorReporter(reporter)
    const unwatch = watchQueueFailures()

    await runJob('completed')
    await runJob('retrying', new Error('temporaire'))
    unwatch()

    assert.lengthOf(captured, 0)
  })

  test('ne signale plus rien après désabonnement', async ({ assert }) => {
    const { reporter, captured } = fakeReporter()
    setErrorReporter(reporter)
    watchQueueFailures()()

    await runJob('failed', new Error('boom'))

    assert.lengthOf(captured, 0)
  })
})

test.group('commande error-tracking:test', (group) => {
  group.setup(() => {
    ace.ui.switchMode('raw')
    return () => ace.ui.switchMode('normal')
  })
  group.each.teardown(() => {
    setErrorReporter(null)
  })

  test('envoie une erreur de test au rapporteur actif', async ({ assert }) => {
    const { reporter, captured } = fakeReporter()
    setErrorReporter(reporter)

    const command = await ace.create(ErrorTrackingTest, [])
    await command.exec()

    command.assertSucceeded()
    assert.lengthOf(captured, 1)
    assert.equal((captured[0].error as Error).message, ERROR_TRACKING_TEST_MESSAGE)
  })

  test('échoue quand SENTRY_DSN est absent', async ({ assert }) => {
    const command = await ace.create(ErrorTrackingTest, [])
    await command.exec()

    command.assertFailed()
    assert.isFalse(isErrorTrackingEnabled())
  })
})
