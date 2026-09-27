import { test } from '@japa/runner'
import AnalyzeExerciseQualitativeJob from '#jobs/analyze_exercise_qualitative_job'
import ExerciseResult from '#models/exercise_result'
import Notification from '#models/notification'
import { NullAiTextProvider } from '#services/ai/null_ai_text_provider'
import { EXERCICE_RESULTS_TYPES, exerciceResultStatusValues } from '#shared/constants/exercises'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { AI_PSEUDONYM } from '#shared/helpers/ai/exercise_profile'
import { createAdvisor, createCandidate } from '#tests/support/actors'
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

  test("enregistre un message d'erreur quand le fournisseur IA échoue", async ({ assert }) => {
    const advisor = await createAdvisor()
    const { employee } = await createCandidate({ advisor })
    const result = await createResult(employee.id, exerciceResultStatusValues.COMPLETED)

    const originalConsoleError = console.error
    console.error = () => {}
    try {
      await withFailingProvider(() => run(result.id))
    } finally {
      console.error = originalConsoleError
    }

    await result.refresh()
    assert.equal(result.qualitativeAnalysis, "Erreur lors de la génération de l'analyse.")
    assert.lengthOf(await Notification.query().where('user_id', advisor.id), 0)
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
