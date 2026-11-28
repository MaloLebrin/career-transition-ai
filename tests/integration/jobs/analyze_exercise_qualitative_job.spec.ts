import { test } from '@japa/runner'
import AnalyzeExerciseQualitativeJob, {
  ANALYSIS_MAX_RETRIES,
  analysisRetryBackoff,
} from '#jobs/analyze_exercise_qualitative_job'
import { setErrorReporter, type ErrorContext } from '#services/error_tracking_service'
import ExerciseResult from '#models/exercise_result'
import Notification from '#models/notification'
import { NotificationService } from '#services/notification_service'
import { B2C_FREE_EXERCISE_TYPES } from '#shared/constants/b2c'
import { NullAiTextProvider } from '#services/ai/null_ai_text_provider'
import {
  EXERCICE_RESULTS_TYPES,
  exerciceResultStatusValues,
  QUALITATIVE_ANALYSIS_STATUSES,
} from '#shared/constants/exercises'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { AI_PSEUDONYM } from '#shared/helpers/ai/exercise_profile'
import {
  createAdvisor,
  createB2cCandidate,
  createCandidate,
  createInHouseExpert,
} from '#tests/support/actors'
import env from '#start/env'

/**
 * `.env.test` fixe `AI_PROVIDER=none` : le job passe par `NullAiTextProvider`,
 * dont la réponse est stable et sans réseau. `QUEUE_DRIVER=sync` exécute le job
 * au `dispatch()`.
 */
const NULL_ANALYSIS = await new NullAiTextProvider().completeText('')

async function run(exerciseResultId: number) {
  await AnalyzeExerciseQualitativeJob.dispatch({ exerciseResultId }).toQueue('ai')
}

async function createResult(employeeId: number, status: string) {
  return ExerciseResult.create({
    employeeId,
    type: EXERCICE_RESULTS_TYPES.MOTIVATION,
    status: status as any,
    data: { ranked: [], matrix: [] },
    qualitativeAnalysis: null,
  })
}

/** Force `AI_PROVIDER=mistral` sans clé : le fournisseur échoue avant tout appel réseau. */
async function withFailingProvider(callback: () => Promise<void>) {
  const original = env.get
  env.get = ((key: any, ...rest: any[]) => {
    if (key === 'AI_PROVIDER') return 'mistral'
    if (key === 'MISTRAL_API_KEY') return undefined
    return (original as any).call(env, key, ...rest)
  }) as any
  try {
    await callback()
  } finally {
    env.get = original
  }
}

/** Capture les envois au suivi des erreurs (Sentry) le temps du callback. */
async function captureReports(callback: () => Promise<void>) {
  const reports: Array<{ error: unknown; context: ErrorContext }> = []
  const previous = setErrorReporter({
    capture: (error, context) => reports.push({ error, context }),
  })
  try {
    await callback()
  } finally {
    setErrorReporter(previous)
  }
  return reports
}

test.group('AnalyzeExerciseQualitativeJob', () => {
  test("enregistre l'analyse et notifie le conseiller du candidat", async ({ assert }) => {
    const advisor = await createAdvisor()
    const { employee } = await createCandidate({ advisor })
    const result = await createResult(employee.id, exerciceResultStatusValues.COMPLETED)

    await run(result.id)

    await result.refresh()
    assert.equal(result.qualitativeAnalysis, NULL_ANALYSIS)

    const notifications = await Notification.query().where('user_id', advisor.id)
    assert.lengthOf(notifications, 1)
    const [notification] = notifications
    assert.equal(notification.type, NOTIFICATION_TYPES.AI_SYNTHESIS_READY)
    assert.equal(notification.title, `Analyse IA disponible : ${employee.name}`)
    assert.deepEqual(notification.meta, {
      exerciseResultId: result.id,
      employeeId: employee.id,
      exerciseType: EXERCICE_RESULTS_TYPES.MOTIVATION,
    })
  })

  test("ne modifie pas la durée de l'exercice pendant l'analyse IA", async ({ assert }) => {
    const { employee } = await createCandidate()
    const result = await createResult(employee.id, exerciceResultStatusValues.COMPLETED)
    result.duration = 40
    await result.save()

    const originalNow = Date.now
    const original = NullAiTextProvider.prototype.completeText
    let now = 1_000_000
    Date.now = () => now
    NullAiTextProvider.prototype.completeText = async function (prompt: string) {
      now += 12_000
      return original.call(this, prompt)
    }
    try {
      await run(result.id)
    } finally {
      Date.now = originalNow
      NullAiTextProvider.prototype.completeText = original
    }

    await result.refresh()
    assert.equal(result.qualitativeAnalysis, NULL_ANALYSIS)
    assert.equal(result.duration, 40)
  })

  test("enregistre l'analyse sans notification pour un candidat sans conseiller", async ({
    assert,
  }) => {
    const { employee } = await createCandidate()
    const result = await createResult(employee.id, exerciceResultStatusValues.COMPLETED)
    const before = await Notification.query().count('* as total')

    await run(result.id)

    await result.refresh()
    assert.equal(result.qualitativeAnalysis, NULL_ANALYSIS)
    const after = await Notification.query().count('* as total')
    assert.equal(Number(after[0].$extras.total), Number(before[0].$extras.total))
  })

  test('notifie directement un particulier B2C sans expert (#100)', async ({ assert }) => {
    const { user, employee } = await createB2cCandidate()
    const result = await createResult(employee.id, exerciceResultStatusValues.COMPLETED)

    await run(result.id)

    await result.refresh()
    assert.equal(result.qualitativeAnalysis, NULL_ANALYSIS)
    const notifications = await Notification.query().where('user_id', user.id)
    assert.lengthOf(notifications, 1)
    assert.equal(notifications[0].type, NOTIFICATION_TYPES.AI_ANALYSIS_READY_CANDIDATE)
    assert.equal(
      (notifications[0].meta as { href: string }).href,
      `/dashboard/candidat/exercises/${EXERCICE_RESULTS_TYPES.MOTIVATION}`
    )
  })

  test('B2C avec expert assigné : le particulier et l’expert sont prévenus', async ({ assert }) => {
    const expert = await createInHouseExpert()
    const { user, employee } = await createB2cCandidate({ expert })
    const result = await createResult(employee.id, exerciceResultStatusValues.COMPLETED)

    await run(result.id)

    const candidate = await Notification.query().where('user_id', user.id)
    assert.lengthOf(candidate, 1)
    assert.equal(candidate[0].type, NOTIFICATION_TYPES.AI_ANALYSIS_READY_CANDIDATE)
    const advisor = await Notification.query().where('user_id', expert.id)
    assert.lengthOf(advisor, 1)
    assert.equal(advisor[0].type, NOTIFICATION_TYPES.AI_SYNTHESIS_READY)
  })

  test('un candidat B2B n’est jamais notifié lui-même', async ({ assert }) => {
    const { user, employee } = await createCandidate()
    const result = await createResult(employee.id, exerciceResultStatusValues.COMPLETED)

    await run(result.id)

    assert.lengthOf(await Notification.query().where('user_id', user.id), 0)
  })

  test('ignore un exercice encore en brouillon', async ({ assert }) => {
    const advisor = await createAdvisor()
    const { employee } = await createCandidate({ advisor })
    const result = await createResult(employee.id, exerciceResultStatusValues.DRAFT)

    await run(result.id)

    await result.refresh()
    assert.isNull(result.qualitativeAnalysis)
    assert.lengthOf(await Notification.query().where('user_id', advisor.id), 0)
  })

  test('ne fait rien pour un résultat introuvable', async ({ assert }) => {
    await assert.doesNotReject(() => run(999_999_999))
  })

  test("n'écrit aucun texte d'erreur quand le fournisseur IA échoue", async ({ assert }) => {
    const advisor = await createAdvisor()
    const { employee } = await createCandidate({ advisor })
    const result = await createResult(employee.id, exerciceResultStatusValues.COMPLETED)
    result.duration = 40
    await result.save()

    await withFailingProvider(() => run(result.id))

    await result.refresh()
    assert.isNull(result.qualitativeAnalysis)
    assert.equal(result.duration, 40)
    assert.lengthOf(await Notification.query().where('user_id', advisor.id), 0)
  })

  test('échec du fournisseur → le job échoue et réessaie (#171)', async ({ assert }) => {
    const { employee } = await createCandidate()
    const result = await createResult(employee.id, exerciceResultStatusValues.COMPLETED)

    let calls = 0
    const original = NullAiTextProvider.prototype.completeText
    NullAiTextProvider.prototype.completeText = async function (prompt: string) {
      calls++
      if (calls === 1) throw new Error('Mistral 503')
      return original.call(this, prompt)
    }
    try {
      const reports = await captureReports(() => run(result.id))
      assert.lengthOf(reports, 0)
    } finally {
      NullAiTextProvider.prototype.completeText = original
    }

    assert.equal(calls, 2)
    await result.refresh()
    assert.equal(result.qualitativeAnalysis, NULL_ANALYSIS)
    assert.equal(result.qualitativeAnalysisStatus, QUALITATIVE_ANALYSIS_STATUSES.DONE)
  })

  test('après le dernier essai → statut `failed` et reportError (#171)', async ({ assert }) => {
    const advisor = await createAdvisor()
    const { employee } = await createCandidate({ advisor })
    const result = await createResult(employee.id, exerciceResultStatusValues.COMPLETED)

    const failure = new Error('Mistral 503')
    let calls = 0
    const original = NullAiTextProvider.prototype.completeText
    NullAiTextProvider.prototype.completeText = async function () {
      calls++
      throw failure
    }
    let reports: Awaited<ReturnType<typeof captureReports>> = []
    try {
      reports = await captureReports(() => run(result.id))
    } finally {
      NullAiTextProvider.prototype.completeText = original
    }

    assert.equal(calls, 1 + ANALYSIS_MAX_RETRIES)
    await result.refresh()
    assert.isNull(result.qualitativeAnalysis)
    assert.equal(result.qualitativeAnalysisStatus, QUALITATIVE_ANALYSIS_STATUSES.FAILED)
    assert.lengthOf(reports, 1)
    assert.strictEqual(reports[0].error, failure)
    assert.deepEqual(reports[0].context, {
      tags: { queue: 'ai', job: 'AnalyzeExerciseQualitativeJob' },
      extra: { exerciseResultId: result.id },
    })
    assert.lengthOf(await Notification.query().where('user_id', advisor.id), 0)
  })

  test('B2C gratuit : une analyse en échec reste relançable (#171)', async ({ assert }) => {
    const { employee } = await createB2cCandidate()
    const result = await createResult(employee.id, exerciceResultStatusValues.COMPLETED)

    await withFailingProvider(() => run(result.id))
    await result.refresh()
    assert.equal(result.qualitativeAnalysisStatus, QUALITATIVE_ANALYSIS_STATUSES.FAILED)

    await run(result.id)
    await result.refresh()
    assert.equal(result.qualitativeAnalysis, NULL_ANALYSIS)
    assert.equal(result.qualitativeAnalysisStatus, QUALITATIVE_ANALYSIS_STATUSES.DONE)
  })

  test('exercice ignoré à l’exécution : un `pending` posé au dispatch est levé', async ({
    assert,
  }) => {
    const { employee } = await createCandidate()
    const result = await createResult(employee.id, exerciceResultStatusValues.DRAFT)
    result.qualitativeAnalysisStatus = QUALITATIVE_ANALYSIS_STATUSES.PENDING
    await result.save()

    await run(result.id)

    await result.refresh()
    assert.isNull(result.qualitativeAnalysisStatus)
  })

  test('délai progressif entre les essais : exponentiel hors test (#171)', ({ assert }) => {
    const production = analysisRetryBackoff(false)()
    assert.isAtLeast(production.calculateDelay(1), 15_000)
    assert.isAtMost(production.calculateDelay(2), 5 * 60_000)
    assert.isAbove(production.calculateDelay(3), production.calculateDelay(1))
    assert.equal(analysisRetryBackoff(true)().calculateDelay(2), 1)
    assert.equal(AnalyzeExerciseQualitativeJob.options.retry?.maxRetries, ANALYSIS_MAX_RETRIES)
  })

  test("une notification en échec n'écrase pas l'analyse enregistrée", async ({ assert }) => {
    const advisor = await createAdvisor()
    const { employee } = await createCandidate({ advisor })
    const result = await createResult(employee.id, exerciceResultStatusValues.COMPLETED)

    const original = NotificationService.prototype.notify
    NotificationService.prototype.notify = async () => {
      throw new Error('notification down')
    }
    try {
      await run(result.id)
    } finally {
      NotificationService.prototype.notify = original
    }

    await result.refresh()
    assert.equal(result.qualitativeAnalysis, NULL_ANALYSIS)
  })

  test('B2C : exercice verrouillé (forfait non réglé) → aucune analyse à l’exécution', async ({
    assert,
  }) => {
    const { employee } = await createB2cCandidate()
    const locked = Object.values(EXERCICE_RESULTS_TYPES).find(
      (type) => !B2C_FREE_EXERCISE_TYPES.includes(type as any)
    )!
    const result = await ExerciseResult.create({
      employeeId: employee.id,
      type: locked,
      status: exerciceResultStatusValues.COMPLETED,
      data: {},
      qualitativeAnalysis: null,
    })

    await run(result.id)

    await result.refresh()
    assert.isNull(result.qualitativeAnalysis)
  })

  test('B2C gratuit : analyse déjà présente → non régénérée', async ({ assert }) => {
    const { employee } = await createB2cCandidate()
    const result = await createResult(employee.id, exerciceResultStatusValues.COMPLETED)
    result.qualitativeAnalysis = 'Première analyse'
    await result.save()

    await run(result.id)

    await result.refresh()
    assert.equal(result.qualitativeAnalysis, 'Première analyse')
  })

  test("n'envoie ni le nom ni l'e-mail du candidat au fournisseur IA (RGPD)", async ({
    assert,
  }) => {
    const { employee } = await createCandidate()
    employee.merge({ summary: `Je suis ${employee.name}, joignable à ${employee.email}.` })
    await employee.save()
    const result = await ExerciseResult.create({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.VALUES,
      status: exerciceResultStatusValues.COMPLETED,
      data: { note: `Réponse de ${employee.name}` },
      qualitativeAnalysis: null,
    })

    const prompts: string[] = []
    const original = NullAiTextProvider.prototype.completeText
    NullAiTextProvider.prototype.completeText = async function (prompt: string) {
      prompts.push(prompt)
      return original.call(this, prompt)
    }
    try {
      await run(result.id)
    } finally {
      NullAiTextProvider.prototype.completeText = original
    }

    assert.lengthOf(prompts, 1)
    assert.notInclude(prompts[0], employee.name)
    assert.notInclude(prompts[0], employee.email)
    assert.include(prompts[0], AI_PSEUDONYM)
  })
})
