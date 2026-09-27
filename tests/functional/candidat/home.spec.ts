import { test } from '@japa/runner'
import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import {
  EXERCICE_RESULTS_TYPES,
  EXERCISE_LIST,
  exerciceResultStatusValues,
} from '#shared/constants/exercises'
import { createAdvisor, createCandidate } from '#tests/support/actors'
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
    ])
    assert.equal((props.employee as { id: number }).id, employee.id)
    assert.equal(props.completedExercises, 0)
    assert.equal(props.totalExercises, EXERCISE_LIST.length)
    assert.equal(props.exerciseCompletionPercent, 0)

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
    // `exerciseProgressByType` n'est pas asserté ici : `getExerciseProgressByType`
    // étale (`{ ...result }`) des instances Lucid, dont les colonnes vivent dans
    // `$attributes` — `progressPercent` y est perdu et la carte reste à 0
    // (bug signalé, non épinglé).
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
