import { test } from '@japa/runner'
import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import { SupportPlanStepExerciseFactory } from '#database/factories/support_plan_step_exercise_factory'
import { SupportPlanStepFactory } from '#database/factories/support_plan_step_factory'
import { EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'
import { createAdvisor, createCandidate } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { truncateDb } from '#tests/utils/db'

/**
 * Détail d'une étape du plan — `GET /dashboard/candidat/steps/:stepId`
 * (`EmployeesController.showStepDetailCandidat`).
 *
 * L'étape est cherchée **sur la fiche du candidat connecté** : l'étape d'un
 * autre candidat répond 404, comme une étape inexistante.
 */

const PAGE = 'dashboard/candidat/StepDetail'

test.group('Candidat — détail d’une étape (GET)', (group) => {
  group.each.setup(() => truncateDb())

  test("rend l'étape avec les résultats de ses seuls exercices", async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    const step = await SupportPlanStepFactory.merge({
      employeeId: employee.id,
      title: 'Bilan motivations',
    }).create()
    await SupportPlanStepExerciseFactory.merge({
      supportPlanStepId: step.id,
      exerciseType: EXERCICE_RESULTS_TYPES.MOTIVATION,
    }).create()
    const related = await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
    }).create()
    // Exercice hors étape : absent des résultats.
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.DISC,
    }).create()

    const response = await client
      .get(`/dashboard/candidat/steps/${step.id}`)
      .loginAs(user)
      .withInertia()

    const props = assertPage(assert, response, PAGE, ['step', 'results'])
    const dto = props.step as { id: number; title: string; associatedExercises: string[] }
    assert.equal(dto.id, step.id)
    assert.equal(dto.title, 'Bilan motivations')
    assert.lengthOf(dto.associatedExercises, 1)
    assert.deepEqual(
      (props.results as Array<{ id: number }>).map((r) => r.id),
      [related.id]
    )
  })

  test('une étape sans exercice rend une liste de résultats vide', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    const step = await SupportPlanStepFactory.merge({ employeeId: employee.id }).create()
    await ExerciseResultFactory.merge({ employeeId: employee.id }).create()

    const response = await client
      .get(`/dashboard/candidat/steps/${step.id}`)
      .loginAs(user)
      .withInertia()

    const props = assertPage(assert, response, PAGE)
    assert.deepEqual(props.results, [])
  })

  test("l'étape d'un autre candidat répond 404", async ({ client }) => {
    const { user } = await createCandidate()
    const other = await createCandidate()
    const step = await SupportPlanStepFactory.merge({ employeeId: other.employee.id }).create()

    const response = await client
      .get(`/dashboard/candidat/steps/${step.id}`)
      .loginAs(user)
      .redirects(0)

    response.assertStatus(404)
  })

  test('une étape inexistante répond 404', async ({ client }) => {
    const { user } = await createCandidate()

    const response = await client.get('/dashboard/candidat/steps/999999').loginAs(user).redirects(0)

    response.assertStatus(404)
  })

  test("renvoie vers l'onboarding un candidat non onboardé", async ({ client }) => {
    const { user, employee } = await createCandidate({ onboarded: false })
    const step = await SupportPlanStepFactory.merge({ employeeId: employee.id }).create()

    const response = await client
      .get(`/dashboard/candidat/steps/${step.id}`)
      .loginAs(user)
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/candidat/onboarding')
  })

  test('refuse un conseiller (403)', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client.get('/dashboard/candidat/steps/1').loginAs(advisor).redirects(0)

    response.assertStatus(403)
  })
})
