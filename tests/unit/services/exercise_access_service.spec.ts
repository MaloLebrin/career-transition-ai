import { makeEntitlements } from '#tests/support/entitlements'
import { SupportPlanStepExerciseFactory } from '#database/factories/support_plan_step_exercise_factory'
import { SupportPlanStepFactory } from '#database/factories/support_plan_step_factory'
import type Employee from '#models/employee'
import { EntitlementsService } from '#services/entitlements_service'
import { ExerciseAccessService } from '#services/exercise_access_service'
import { B2C_FREE_EXERCISE_TYPES, EXERCISE_LOCK_REASONS } from '#shared/constants/b2c'
import {
  EXERCICE_RESULTS_TYPES,
  EXERCISE_LIST,
  type ExerciceResultType,
} from '#shared/constants/exercises'
import { createB2cCandidate, createCandidate } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const service = new ExerciseAccessService(makeEntitlements())
const CATALOGUE = EXERCISE_LIST.map((entry) => entry.slug as ExerciceResultType)

async function planStep(employee: Employee, types: ExerciceResultType[], isLocked = false) {
  const step = await SupportPlanStepFactory.merge({
    employeeId: employee.id,
    advisorId: employee.advisorId,
    isLocked,
    completed: false,
  }).create()
  for (const [index, exerciseType] of types.entries()) {
    await SupportPlanStepExerciseFactory.merge({
      supportPlanStepId: step.id,
      exerciseType,
      sortOrder: index,
    }).create()
  }
}

test.group('ExerciseAccessService.resolve — B2B (plan d’accompagnement)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('ne déverrouille que les exercices des étapes non verrouillées, sans doublon', async ({
    assert,
  }) => {
    const { employee } = await createCandidate()
    await planStep(employee, [EXERCICE_RESULTS_TYPES.MOTIVATION, EXERCICE_RESULTS_TYPES.VALUES])
    await planStep(employee, [EXERCICE_RESULTS_TYPES.MOTIVATION])
    await planStep(employee, [EXERCICE_RESULTS_TYPES.DISC], true)

    const access = await service.resolve(employee)

    assert.equal(access.accountType, 'b2b')
    assert.sameMembers(access.unlockedExerciseSlugs, [
      EXERCICE_RESULTS_TYPES.MOTIVATION,
      EXERCICE_RESULTS_TYPES.VALUES,
    ])
    assert.equal(access.lockedReason, EXERCISE_LOCK_REASONS.PLAN)
    assert.isTrue(access.hasPaidAccess)
    assert.deepEqual(access.freeExerciseTypes, [])
    assert.isTrue(await service.canAccess(employee, EXERCICE_RESULTS_TYPES.VALUES))
    assert.isFalse(await service.canAccess(employee, EXERCICE_RESULTS_TYPES.DISC))
  })

  test('sans plan, rien n’est accessible — y compris les exercices gratuits des B2C', async ({
    assert,
  }) => {
    const { employee } = await createCandidate()

    const access = await service.resolve(employee)

    assert.deepEqual(access.unlockedExerciseSlugs, [])
    assert.isFalse(await service.canAccess(employee, EXERCICE_RESULTS_TYPES.MOTIVATION))
  })

  test("ne lit pas le plan d'un autre candidat", async ({ assert }) => {
    const { employee } = await createCandidate()
    const other = await createCandidate()
    await planStep(other.employee, [EXERCICE_RESULTS_TYPES.MOTIVATION])

    const access = await service.resolve(employee)
    assert.deepEqual(access.unlockedExerciseSlugs, [])
  })

  test("l'analyse IA d'un B2B est toujours lancée, même relancée", async ({ assert }) => {
    const { employee } = await createCandidate()

    assert.isTrue(await service.shouldRunAiAnalysis(employee, EXERCICE_RESULTS_TYPES.DISC, true))
  })
})

test.group('ExerciseAccessService.resolve — B2C (forfait)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('non payé : seuls les exercices gratuits, verrou « payment »', async ({ assert }) => {
    const { employee } = await createB2cCandidate()

    const access = await service.resolve(employee)

    assert.equal(access.accountType, 'b2c')
    assert.deepEqual(access.unlockedExerciseSlugs, [...B2C_FREE_EXERCISE_TYPES])
    assert.equal(access.lockedReason, EXERCISE_LOCK_REASONS.PAYMENT)
    assert.isFalse(access.hasPaidAccess)
    assert.deepEqual(access.freeExerciseTypes, [...B2C_FREE_EXERCISE_TYPES])
    assert.isFalse(access.paymentsEnabled)
    assert.isTrue(await service.canAccess(employee, EXERCICE_RESULTS_TYPES.MOTIVATION))
    assert.isFalse(await service.canAccess(employee, EXERCICE_RESULTS_TYPES.DISC))
  })

  test('payé : tout le catalogue, dans l’ordre de la liste', async ({ assert }) => {
    const { employee } = await createB2cCandidate({ paid: true })

    const access = await service.resolve(employee)

    assert.deepEqual(access.unlockedExerciseSlugs, CATALOGUE)
    assert.isTrue(access.hasPaidAccess)
    assert.isTrue(await service.canAccess(employee, EXERCICE_RESULTS_TYPES.DISC))
  })

  test('le plan d’accompagnement ne change rien pour un B2C non payé', async ({ assert }) => {
    const { employee } = await createB2cCandidate()
    await planStep(employee, [EXERCICE_RESULTS_TYPES.DISC])

    assert.isFalse(await service.canAccess(employee, EXERCICE_RESULTS_TYPES.DISC))
  })

  test('politique IA : gratuit une seule fois, verrouillé jamais, payé toujours', async ({
    assert,
  }) => {
    const { employee: free } = await createB2cCandidate()
    assert.isTrue(await service.shouldRunAiAnalysis(free, EXERCICE_RESULTS_TYPES.MOTIVATION, false))
    assert.isFalse(await service.shouldRunAiAnalysis(free, EXERCICE_RESULTS_TYPES.MOTIVATION, true))
    assert.isFalse(await service.shouldRunAiAnalysis(free, EXERCICE_RESULTS_TYPES.DISC, false))

    const { employee: paid } = await createB2cCandidate({ paid: true })
    assert.isTrue(await service.shouldRunAiAnalysis(paid, EXERCICE_RESULTS_TYPES.DISC, false))
    assert.isTrue(await service.shouldRunAiAnalysis(paid, EXERCICE_RESULTS_TYPES.MOTIVATION, true))
  })
})
