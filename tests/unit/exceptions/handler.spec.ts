import HttpExceptionHandler from '#exceptions/handler'
import DomainException from '#exceptions/domain_exception'
import {
  setErrorReporter,
  type ErrorContext,
  type ErrorReporter,
} from '#services/error_tracking_service'
import { Exception } from '@adonisjs/core/exceptions'
import testUtils from '@adonisjs/core/services/test_utils'
import type { HttpContext } from '@adonisjs/core/http'
import { test } from '@japa/runner'

/**
 * `HttpExceptionHandler.report()` : seules les erreurs serveur (5xx) partent
 * au suivi des erreurs, avec l'utilisateur réduit à son id (issue #27).
 */
test.group('HttpExceptionHandler | suivi des erreurs', (group) => {
  let captured: { error: unknown; context: ErrorContext }[]

  group.each.setup(() => {
    captured = []
    const reporter: ErrorReporter = {
      capture: (error, context) => captured.push({ error, context }),
    }
    const previous = setErrorReporter(reporter)
    return () => {
      setErrorReporter(previous)
    }
  })

  async function report(error: unknown, user?: { id: number }) {
    const ctx = await testUtils.createHttpContext()
    if (user) (ctx as HttpContext & { auth: unknown }).auth = { user }
    await new HttpExceptionHandler().report(error, ctx)
  }

  test("envoie une erreur 500 avec l'id de l'utilisateur", async ({ assert }) => {
    const error = new Error('boom')

    await report(error, { id: 12 })

    assert.lengthOf(captured, 1)
    assert.strictEqual(captured[0].error, error)
    assert.equal(captured[0].context.userId, 12)
    assert.deepInclude(captured[0].context.extra!, { status: 500 })
    assert.property(captured[0].context.tags!, 'route')
  })

  test('envoie une erreur 503 sans utilisateur connecté', async ({ assert }) => {
    await report(new Exception('indisponible', { status: 503 }))

    assert.lengthOf(captured, 1)
    assert.isNull(captured[0].context.userId)
  })

  test("n'envoie ni les erreurs métier, ni les 4xx", async ({ assert }) => {
    await report(new DomainException('Email déjà utilisé', { status: 500 }))
    await report(new Exception('introuvable', { status: 404 }))
    await report(new Exception('interdit', { status: 403 }))
    await report(new Exception('invalide', { status: 422 }))

    assert.lengthOf(captured, 0)
  })
})
