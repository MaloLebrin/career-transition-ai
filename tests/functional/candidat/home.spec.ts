import { test } from '@japa/runner'
import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import {
  EXERCICE_RESULTS_TYPES,
  EXERCISE_LIST,
  exerciceResultStatusValues,
} from '#shared/constants/exercises'
import { B2C_FREE_EXERCISE_TYPES, EXERCISE_LOCK_REASONS } from '#shared/constants/b2c'
import {
  createAdvisor,
  createB2cCandidate,
  createCandidate,
  createInHouseExpert,
} from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { truncateDb } from '#tests/utils/db'
import { DateTime } from 'luxon'

/**
 * Accueil candidat — `GET /dashboard/candidat` (`DashboardController.candidatHome`).
 *
 * Route du sous-groupe `checkOnboarding()` : un candidat non onboardé est
 * renvoyé vers `/dashboard/candidat/onboarding`.
 */

const URL = '/dashboard/candidat'
const PAGE = 'dashboard/employee/home/Home'

test.group('Candidat — accueil (GET /dashboard/candidat)', (group) => {
  group.each.setup(() => truncateDb())

  test('rend la page avec la fiche et une progression vide', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()

    const response = await client.get(URL).loginAs(user).withInertia()

    const props = assertPage(assert, response, PAGE, [
      'employee',
      'completedExercises',
      'totalExercises',
      'exerciseCompletionPercent',
      'exerciseProgressByType',
      'advisor',
      'exerciseAccess',
    ])
    assert.equal((props.employee as { id: number }).id, employee.id)
    assert.equal(props.completedExercises, 0)
    assert.equal(props.totalExercises, EXERCISE_LIST.length)
    assert.equal(props.exerciseCompletionPercent, 0)
    // #100 : accès par le plan pour un B2B, pas d'expert plateforme.
    const access = props.exerciseAccess as { accountType: string; lockedReason: string }
    assert.equal(access.accountType, 'b2b')
    assert.equal(access.lockedReason, EXERCISE_LOCK_REASONS.PLAN)
    assert.isNull(props.advisor)

    const progress = props.exerciseProgressByType as Record<string, number>
    assert.sameMembers(
      Object.keys(progress),
      EXERCISE_LIST.map((e) => e.slug)
    )
    assert.isTrue(Object.values(progress).every((value) => value === 0))
  })

  test('compte les exercices terminés, pas les brouillons', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      status: exerciceResultStatusValues.COMPLETED,
      progressPercent: 100,
    }).create()
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.VALUES,
      status: exerciceResultStatusValues.COMPLETED,
      progressPercent: 100,
    }).create()
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.DISC,
      status: exerciceResultStatusValues.DRAFT,
      date: DateTime.now(),
      progressPercent: 40,
    }).create()

    const response = await client.get(URL).loginAs(user).withInertia()

    const props = assertPage(assert, response, PAGE)
    assert.equal(props.completedExercises, 2)
    assert.equal(props.exerciseCompletionPercent, Math.round((2 / EXERCISE_LIST.length) * 100))
    // Non-régression : `getExerciseProgressByType` étalait (`{ ...result }`) les
    // instances Lucid, perdant `progressPercent` — la carte restait à 0.
    const progress = props.exerciseProgressByType as Record<string, number>
    assert.equal(progress[EXERCICE_RESULTS_TYPES.MOTIVATION], 100)
    assert.equal(progress[EXERCICE_RESULTS_TYPES.VALUES], 100)
    assert.equal(progress[EXERCICE_RESULTS_TYPES.DISC], 40)
    assert.equal(progress[EXERCICE_RESULTS_TYPES.TARGETING], 0)
  })

  test("n'expose que la fiche du candidat connecté", async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    const other = await createCandidate()
    await ExerciseResultFactory.merge({
      employeeId: other.employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      status: exerciceResultStatusValues.COMPLETED,
    }).create()

    const response = await client.get(URL).loginAs(user).withInertia()

    const props = assertPage(assert, response, PAGE)
    assert.equal((props.employee as { id: number }).id, employee.id)
    assert.equal(props.completedExercises, 0)
  })

  test("renvoie vers l'onboarding un candidat non onboardé", async ({ client }) => {
    const { user } = await createCandidate({ onboarded: false })

    const response = await client.get(URL).loginAs(user).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/candidat/onboarding')
  })

  test('refuse un conseiller (403)', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client.get(URL).loginAs(advisor).redirects(0)

    response.assertStatus(403)
  })

  test('redirige un visiteur non connecté vers la connexion', async ({ client }) => {
    const response = await client.get(URL).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
  })
})

test.group('Candidat B2C — accueil (#100)', (group) => {
  group.each.setup(() => truncateDb())

  test('expose l’accès aux exercices gratuits et aucun expert', async ({ client, assert }) => {
    const { user } = await createB2cCandidate()

    const response = await client.get(URL).loginAs(user).withInertia()

    const props = assertPage(assert, response, PAGE, ['advisor', 'exerciseAccess'])
    assert.isNull(props.advisor)
    const access = props.exerciseAccess as {
      accountType: string
      unlockedExerciseSlugs: string[]
      lockedReason: string
      hasPaidAccess: boolean
    }
    assert.equal(access.accountType, 'b2c')
    assert.deepEqual(access.unlockedExerciseSlugs, [...B2C_FREE_EXERCISE_TYPES])
    assert.equal(access.lockedReason, EXERCISE_LOCK_REASONS.PAYMENT)
    assert.isFalse(access.hasPaidAccess)
  })

  test('affiche le nom de l’expert assigné, et rien d’autre de lui', async ({ client, assert }) => {
    const expert = await createInHouseExpert()
    const { user } = await createB2cCandidate({ expert, paid: true })

    const response = await client.get(URL).loginAs(user).withInertia()

    const props = assertPage(assert, response, PAGE)
    assert.deepEqual(props.advisor, { name: expert.name })
    assert.isTrue((props.exerciseAccess as { hasPaidAccess: boolean }).hasPaidAccess)
  })
})
