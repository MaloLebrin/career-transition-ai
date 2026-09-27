import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import { NoteFactory } from '#database/factories/note_factory'
import { SupportPlanStepFactory } from '#database/factories/support_plan_step_factory'
import ExerciseResult from '#models/exercise_result'
import Notification from '#models/notification'
import SupportPlanStepExercise from '#models/support_plan_step_exercise'
import {
  EXERCICE_RESULTS_TYPES,
  EXERCISE_LIST,
  exerciceResultStatusValues,
} from '#shared/constants/exercises'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { createAdvisor, createEmployeeFor } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/**
 * Exercices d'un candidat, côté conseiller :
 * /dashboard/conseiller/employees/:id/exercises[/results/:type|/:type|/:type/(draft|result)]
 */
const exercisesUrl = (employeeId: number) =>
  `/dashboard/conseiller/employees/${employeeId}/exercises`

test.group('Conseiller — exercices : pages', (group) => {
  group.each.setup(() => truncateDb())

  test('la liste ne garde que le dernier résultat par type, du plus récent au plus ancien', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.VALUES,
      status: exerciceResultStatusValues.COMPLETED,
      date: DateTime.fromISO('2030-01-10'),
    }).create()
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.DISC,
      status: exerciceResultStatusValues.DRAFT,
      date: DateTime.fromISO('2030-03-01'),
    }).create()

    const response = await client.get(exercisesUrl(employee.id)).loginAs(advisor).withInertia()

    const props = assertPage(assert, response, 'dashboard/conseiller/exercises/List', [
      'employeeId',
      'results',
    ])
    const results = props.results as Array<{ slug: string; status: string; title: string }>
    assert.deepEqual(
      results.map((r) => [r.slug, r.status]),
      [
        [EXERCICE_RESULTS_TYPES.DISC, exerciceResultStatusValues.DRAFT],
        [EXERCICE_RESULTS_TYPES.VALUES, exerciceResultStatusValues.COMPLETED],
      ]
    )
    assert.equal(
      results[1].title,
      EXERCISE_LIST.find((e) => e.slug === EXERCICE_RESULTS_TYPES.VALUES)!.title
    )
  })

  test('le détail expose le dernier résultat du type et ses notes', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const result = await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      quantitativeScore: 42,
      data: { answers: [1, 2] },
    }).create()
    const note = await NoteFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      authorId: advisor.id,
      exerciseResultId: result.id,
    }).create()

    const response = await client
      .get(`${exercisesUrl(employee.id)}/results/${EXERCICE_RESULTS_TYPES.MOTIVATION}`)
      .loginAs(advisor)
      .withInertia()

    const props = assertPage(assert, response, 'dashboard/conseiller/exercises/ResultDetail', [
      'employeeId',
      'employeeName',
      'result',
      'exerciseType',
      'exerciseTitle',
      'notes',
    ])
    const payload = props.result as { id: number; quantitativeScore: number; data: unknown }
    assert.equal(payload.id, result.id)
    assert.equal(payload.quantitativeScore, 42)
    assert.deepEqual(payload.data, { answers: [1, 2] })
    assert.deepEqual(
      (props.notes as Array<{ id: number }>).map((n) => n.id),
      [note.id]
    )
  })

  test('le détail sans résultat renvoie result: null', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)

    const response = await client
      .get(`${exercisesUrl(employee.id)}/results/${EXERCICE_RESULTS_TYPES.DISC}`)
      .loginAs(advisor)
      .withInertia()

    const props = assertPage(assert, response, 'dashboard/conseiller/exercises/ResultDetail')
    assert.isNull(props.result)
    assert.deepEqual(props.notes, [])
  })

  test('la page d’un exercice connu reprend le brouillon en cours', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.VALUES,
      status: exerciceResultStatusValues.DRAFT,
      data: { step: 2 },
    }).create()

    const response = await client
      .get(`${exercisesUrl(employee.id)}/${EXERCICE_RESULTS_TYPES.VALUES}`)
      .loginAs(advisor)
      .withInertia()

    const props = assertPage(assert, response, 'dashboard/shared/exercises/Values', [
      'employeeId',
      'initialDraftsByType',
    ])
    const drafts = props.initialDraftsByType as Record<string, { data: unknown } | null>
    assert.deepEqual(drafts[EXERCICE_RESULTS_TYPES.VALUES]?.data, { step: 2 })
  })

  test('un type sans page dédiée retombe sur la page générique', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)

    const response = await client
      .get(`${exercisesUrl(employee.id)}/${EXERCICE_RESULTS_TYPES.CV_ANALYSIS}`)
      .loginAs(advisor)
      .withInertia()

    const props = assertPage(assert, response, 'dashboard/conseiller/exercises/Home', [
      'type',
      'employeeId',
      'employee',
      'initialDraftsByType',
    ])
    assert.equal(props.type, EXERCICE_RESULTS_TYPES.CV_ANALYSIS)
  })

  test("un conseiller d'une autre organisation est renvoyé vers sa liste", async ({
    client,
    assert,
  }) => {
    const employee = await createEmployeeFor(await createAdvisor())
    const intruder = await createAdvisor()

    for (const path of [
      '',
      `/results/${EXERCICE_RESULTS_TYPES.VALUES}`,
      `/${EXERCICE_RESULTS_TYPES.VALUES}`,
    ]) {
      const response = await client
        .get(`${exercisesUrl(employee.id)}${path}`)
        .loginAs(intruder)
        .withInertia()
        .redirects(0)

      response.assertStatus(302)
      response.assertHeader('location', '/dashboard/conseiller/employees')
      assert.equal(response.flashMessage('error'), 'Candidat introuvable.', path)
    }
  })
})

test.group('Conseiller — exercices : enregistrement', (group) => {
  group.each.setup(() => truncateDb())

  test('enregistre un brouillon puis le met à jour sans doublon', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const url = `${exercisesUrl(employee.id)}/${EXERCICE_RESULTS_TYPES.VALUES}/draft`

    for (const data of [{ step: 1 }, { step: 2 }]) {
      const response = await client
        .post(url)
        .header('referer', `${exercisesUrl(employee.id)}/values`)
        .json({ employeeId: String(employee.id), type: EXERCICE_RESULTS_TYPES.VALUES, data })
        .loginAs(advisor)
        .withInertia()
        .redirects(0)
      response.assertStatus(302)
      response.assertHeader('location', `${exercisesUrl(employee.id)}/values`)
    }

    const rows = await ExerciseResult.query().where('employeeId', employee.id)
    assert.lengthOf(rows, 1)
    assert.equal(rows[0].status, exerciceResultStatusValues.DRAFT)
    assert.deepEqual(rows[0].data, { step: 2 })
  })

  test('enregistre un résultat terminé, complète l’étape associée et notifie le conseiller', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const step = await SupportPlanStepFactory.merge({
      employeeId: employee.id,
      isLocked: false,
      completed: false,
    }).create()
    await SupportPlanStepExercise.create({
      supportPlanStepId: step.id,
      exerciseType: EXERCICE_RESULTS_TYPES.DISC,
      sortOrder: 0,
    })

    const response = await client
      .post(`${exercisesUrl(employee.id)}/${EXERCICE_RESULTS_TYPES.DISC}/result`)
      .json({
        type: EXERCICE_RESULTS_TYPES.DISC,
        status: exerciceResultStatusValues.COMPLETED,
        date: '2030-01-10',
        duration: 0,
        data: { profile: 'D' },
        plan: [],
      })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', `/dashboard/conseiller/employees/${employee.id}`)
    assert.equal(response.flashMessage('success'), 'Exercice DISC enregistré.')

    const result = await ExerciseResult.query().where('employeeId', employee.id).firstOrFail()
    assert.equal(result.status, exerciceResultStatusValues.COMPLETED)
    assert.equal(result.duration, 0)
    assert.deepEqual(result.data, { profile: 'D' })

    await step.refresh()
    assert.isTrue(step.completed)

    // Le job d'analyse IA (queue sync, AI_PROVIDER=none) notifie aussi le conseiller
    const notifications = await Notification.query().where('userId', advisor.id)
    assert.include(
      notifications.map((n) => n.type),
      NOTIFICATION_TYPES.EXERCISE_COMPLETED
    )
  })

  test('rejette un résultat sans statut ni plan', async ({ client, assert, db }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)

    const response = await client
      .post(`${exercisesUrl(employee.id)}/${EXERCICE_RESULTS_TYPES.DISC}/result`)
      .json({ type: EXERCICE_RESULTS_TYPES.DISC, data: {} })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    assertFieldErrors(assert, response, ['status', 'plan'])
    await db.assertEmpty('exercise_results')
  })

  test('rejette un brouillon de type inconnu', async ({ client, assert, db }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)

    const response = await client
      .post(`${exercisesUrl(employee.id)}/values/draft`)
      .json({ employeeId: String(employee.id), type: 'tarot', data: {} })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    assertFieldErrors(assert, response, ['type'])
    await db.assertEmpty('exercise_results')
  })
})

/**
 * Non-régression : `saveDraftFromDashboard` / `storeFromDashboard` prenaient
 * l'id du candidat dans l'URL sans filtre d'organisation. Un conseiller de
 * l'organisation B écrivait un résultat sur le candidat de A — et déclenchait
 * l'analyse IA, la notification du conseiller de A et le recalcul des étapes.
 */
test.group('Conseiller — exercices : isolation entre organisations', (group) => {
  group.each.setup(() => truncateDb())

  test("n'enregistre pas de brouillon sur le candidat d'une autre organisation (404)", async ({
    client,
    assert,
  }) => {
    const employee = await createEmployeeFor(await createAdvisor())
    const intruder = await createAdvisor()

    const response = await client
      .post(`${exercisesUrl(employee.id)}/${EXERCICE_RESULTS_TYPES.VALUES}/draft`)
      .loginAs(intruder)
      .json({
        employeeId: String(employee.id),
        type: EXERCICE_RESULTS_TYPES.VALUES,
        data: { step: 1 },
      })
      .redirects(0)

    response.assertStatus(404)
    assert.lengthOf(await ExerciseResult.query().where('employeeId', employee.id), 0)
  })

  test("n'enregistre pas de résultat sur le candidat d'une autre organisation (404)", async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const intruder = await createAdvisor()

    const response = await client
      .post(`${exercisesUrl(employee.id)}/${EXERCICE_RESULTS_TYPES.VALUES}/result`)
      .loginAs(intruder)
      .json({ type: EXERCICE_RESULTS_TYPES.VALUES, status: 'completed', data: {}, plan: [] })
      .redirects(0)

    response.assertStatus(404)
    assert.lengthOf(await ExerciseResult.query().where('employeeId', employee.id), 0)
    assert.lengthOf(await Notification.query().where('userId', advisor.id), 0)
  })
})

test.group(
  'Conseiller — exercices sans candidat (/dashboard/conseiller/exercises/:type)',
  (group) => {
    group.each.setup(() => truncateDb())

    // Non-régression : la route passait par `getEmployeeForUser`, qui lève pour
    // tout utilisateur sans fiche candidat — donc pour tout conseiller (500).
    test('un conseiller sans fiche candidat obtient la page de l’exercice, sans brouillon', async ({
      client,
      assert,
    }) => {
      const advisor = await createAdvisor()

      const response = await client
        .get(`/dashboard/conseiller/exercises/${EXERCICE_RESULTS_TYPES.VALUES}`)
        .loginAs(advisor)
        .withInertia()

      const props = assertPage(assert, response, 'dashboard/shared/exercises/Values', [
        'initialDraftsByType',
      ])
      assert.deepEqual(props.initialDraftsByType, {})
    })

    test('un type sans page dédiée renvoie 404', async ({ client }) => {
      const advisor = await createAdvisor()

      const response = await client
        .get(`/dashboard/conseiller/exercises/${EXERCICE_RESULTS_TYPES.CV_ANALYSIS}`)
        .loginAs(advisor)
        .withInertia()

      response.assertStatus(404)
    })
  }
)
