import { SupportPlanStepFactory } from '#database/factories/support_plan_step_factory'
import SupportPlanStep from '#models/support_plan_step'
import SupportPlanStepExercise from '#models/support_plan_step_exercise'
import { APPOINTMENTS_STATUSES } from '#shared/constants/appointment'
import { EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'
import { createAdvisor, createEmployeeFor, createSuperAdmin } from '#tests/support/actors'
import { assertFieldErrors, assertNoFieldErrors, inertiaErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Feuille de route (RDV) d'un candidat, côté conseiller :
 * /dashboard/conseiller/employees/:id/steps[/:stepId[/lock|/unlock]]
 *
 * Les PUT/DELETE passés en Inertia sont redirigés en 303 (le middleware
 * Inertia convertit les 302 pour que le navigateur rejoue un GET).
 */
const stepsUrl = (employeeId: number) => `/dashboard/conseiller/employees/${employeeId}/steps`

async function exerciseTypesOf(stepId: number): Promise<string[]> {
  const rows = await SupportPlanStepExercise.query()
    .where('supportPlanStepId', stepId)
    .orderBy('sortOrder', 'asc')
  return rows.map((r) => r.exerciseType)
}

test.group('Conseiller — étapes : création', (group) => {
  group.each.setup(() => truncateDb())

  test('crée une étape avec ses exercices associés, verrouillée par défaut', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)

    const response = await client
      .post(stepsUrl(employee.id))
      .header('referer', `/dashboard/conseiller/employees/${employee.id}`)
      .json({
        title: 'Bilan initial',
        description: 'Premier rendez-vous',
        scheduledAt: '2030-01-15T09:30:00.000Z',
        dueDate: '2030-01-20',
        locationOrLink: 'https://visio.example.com/abc',
        associatedExercises: [EXERCICE_RESULTS_TYPES.MOTIVATION, EXERCICE_RESULTS_TYPES.VALUES],
      })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', `/dashboard/conseiller/employees/${employee.id}`)
    assertNoFieldErrors(assert, response)
    assert.equal(response.flashMessage('success'), 'RDV créé')

    const step = await SupportPlanStep.query().where('employeeId', employee.id).firstOrFail()
    assert.equal(step.title, 'Bilan initial')
    assert.equal(step.advisorId, advisor.id)
    assert.equal(step.status, APPOINTMENTS_STATUSES.SCHEDULED)
    assert.isTrue(step.isLocked)
    assert.isFalse(step.completed)
    assert.equal(step.sortOrder, 0)
    assert.equal(step.scheduledAt?.toUTC().toISO(), '2030-01-15T09:30:00.000Z')
    assert.equal(step.dueDate?.toISODate(), '2030-01-20')
    assert.deepEqual(await exerciseTypesOf(step.id), [
      EXERCICE_RESULTS_TYPES.MOTIVATION,
      EXERCICE_RESULTS_TYPES.VALUES,
    ])
  })

  test("l'ordre suit la dernière étape existante quand sortOrder est absent", async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    await SupportPlanStepFactory.merge({ employeeId: employee.id, sortOrder: 4 }).create()
    await SupportPlanStepFactory.merge({ employeeId: employee.id, sortOrder: 2 }).create()

    await client
      .post(stepsUrl(employee.id))
      .json({ title: 'Suivante', isLocked: false })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    const step = await SupportPlanStep.query()
      .where('employeeId', employee.id)
      .where('title', 'Suivante')
      .firstOrFail()
    assert.equal(step.sortOrder, 5)
    assert.isFalse(step.isLocked)
    assert.deepEqual(await exerciseTypesOf(step.id), [])
  })

  test('rejette un statut et un exercice inconnus', async ({ client, assert, db }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)

    const response = await client
      .post(stepsUrl(employee.id))
      .json({ title: 'x', status: 'pending', associatedExercises: ['yoga'] })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    assertFieldErrors(assert, response, ['status', 'associatedExercises.0'])
    await db.assertEmpty('support_plan_steps')
  })

  test("un conseiller d'une autre organisation reçoit 404", async ({ client, db }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const intruder = await createAdvisor()

    const response = await client
      .post(stepsUrl(employee.id))
      .json({ title: 'intrusion' })
      .loginAs(intruder)
      .redirects(0)

    response.assertStatus(404)
    await db.assertEmpty('support_plan_steps')
  })

  test('un super admin est refusé par le contrôleur (403)', async ({ client, db }) => {
    const superAdmin = await createSuperAdmin()
    const employee = await createEmployeeFor(superAdmin)

    const response = await client
      .post(stepsUrl(employee.id))
      .json({ title: 'x' })
      .loginAs(superAdmin)
      .redirects(0)

    response.assertStatus(403)
    await db.assertEmpty('support_plan_steps')
  })
})

test.group('Conseiller — étapes : modification, suppression, verrouillage', (group) => {
  group.each.setup(() => truncateDb())

  test('met à jour les champs et remplace les exercices associés', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const step = await SupportPlanStepFactory.merge({
      employeeId: employee.id,
      advisorId: advisor.id,
      title: 'Avant',
    }).create()
    await SupportPlanStepExercise.create({
      supportPlanStepId: step.id,
      exerciseType: EXERCICE_RESULTS_TYPES.DISC,
      sortOrder: 0,
    })

    const response = await client
      .put(`${stepsUrl(employee.id)}/${step.id}`)
      .header('referer', `/dashboard/conseiller/employees/${employee.id}`)
      .json({
        title: 'Après',
        status: APPOINTMENTS_STATUSES.COMPLETED,
        completed: true,
        notes: 'Compte rendu',
        endedAt: '2030-02-01T10:00:00.000Z',
        associatedExercises: [EXERCICE_RESULTS_TYPES.TARGETING],
      })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', `/dashboard/conseiller/employees/${employee.id}`)
    assert.equal(response.flashMessage('success'), 'RDV mis à jour')

    await step.refresh()
    assert.equal(step.title, 'Après')
    assert.equal(step.status, APPOINTMENTS_STATUSES.COMPLETED)
    assert.isTrue(step.completed)
    assert.equal(step.notes, 'Compte rendu')
    assert.equal(step.endedAt?.toUTC().toISO(), '2030-02-01T10:00:00.000Z')
    assert.deepEqual(await exerciseTypesOf(step.id), [EXERCICE_RESULTS_TYPES.TARGETING])
  })

  test('sans associatedExercises, les exercices existants sont conservés', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const step = await SupportPlanStepFactory.merge({ employeeId: employee.id }).create()
    await SupportPlanStepExercise.create({
      supportPlanStepId: step.id,
      exerciseType: EXERCICE_RESULTS_TYPES.DISC,
      sortOrder: 0,
    })

    await client
      .put(`${stepsUrl(employee.id)}/${step.id}`)
      .json({ title: 'Renommée' })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    assert.deepEqual(await exerciseTypesOf(step.id), [EXERCICE_RESULTS_TYPES.DISC])
  })

  test('rejette un statut invalide à la modification', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const step = await SupportPlanStepFactory.merge({ employeeId: employee.id }).create()

    const response = await client
      .put(`${stepsUrl(employee.id)}/${step.id}`)
      .json({ status: 'done', completed: 'peut-être' })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    assert.deepEqual(Object.keys(inertiaErrors(response)).sort(), ['completed', 'status'])
    await step.refresh()
    assert.equal(step.status, APPOINTMENTS_STATUSES.SCHEDULED)
  })

  test("une étape d'un autre candidat de l'organisation renvoie 404", async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const other = await createEmployeeFor(advisor)
    const otherStep = await SupportPlanStepFactory.merge({
      employeeId: other.id,
      title: 'Intacte',
      isLocked: true,
    }).create()

    for (const request of [
      client.put(`${stepsUrl(employee.id)}/${otherStep.id}`).json({ title: 'x' }),
      client.delete(`${stepsUrl(employee.id)}/${otherStep.id}`),
      client.post(`${stepsUrl(employee.id)}/${otherStep.id}/unlock`),
      client.post(`${stepsUrl(employee.id)}/${otherStep.id}/lock`),
    ]) {
      const response = await request.loginAs(advisor).redirects(0)
      response.assertStatus(404)
    }

    await otherStep.refresh()
    assert.equal(otherStep.title, 'Intacte')
    assert.isTrue(otherStep.isLocked)
  })

  test("un conseiller d'une autre organisation reçoit 404 partout", async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const step = await SupportPlanStepFactory.merge({
      employeeId: employee.id,
      isLocked: true,
    }).create()
    const intruder = await createAdvisor()

    for (const request of [
      client.put(`${stepsUrl(employee.id)}/${step.id}`).json({ title: 'x' }),
      client.delete(`${stepsUrl(employee.id)}/${step.id}`),
      client.post(`${stepsUrl(employee.id)}/${step.id}/unlock`),
      client.post(`${stepsUrl(employee.id)}/${step.id}/lock`),
    ]) {
      const response = await request.loginAs(intruder).redirects(0)
      response.assertStatus(404)
    }

    await step.refresh()
    assert.isTrue(step.isLocked)
  })

  test('un super admin est refusé par le contrôleur (403) sur chaque action', async ({
    client,
  }) => {
    const superAdmin = await createSuperAdmin()
    const employee = await createEmployeeFor(superAdmin)
    const step = await SupportPlanStepFactory.merge({ employeeId: employee.id }).create()

    for (const request of [
      client.put(`${stepsUrl(employee.id)}/${step.id}`).json({ title: 'x' }),
      client.delete(`${stepsUrl(employee.id)}/${step.id}`),
      client.post(`${stepsUrl(employee.id)}/${step.id}/unlock`),
      client.post(`${stepsUrl(employee.id)}/${step.id}/lock`),
    ]) {
      const response = await request.loginAs(superAdmin).redirects(0)
      response.assertStatus(403)
    }
  })

  test('déverrouille puis reverrouille une étape', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const step = await SupportPlanStepFactory.merge({
      employeeId: employee.id,
      isLocked: true,
    }).create()

    const unlock = await client
      .post(`${stepsUrl(employee.id)}/${step.id}/unlock`)
      .loginAs(advisor)
      .withInertia()
      .redirects(0)
    unlock.assertStatus(302)
    assert.equal(unlock.flashMessage('success'), 'RDV déverrouillé')
    await step.refresh()
    assert.isFalse(step.isLocked)

    const lock = await client
      .post(`${stepsUrl(employee.id)}/${step.id}/lock`)
      .loginAs(advisor)
      .withInertia()
      .redirects(0)
    lock.assertStatus(302)
    assert.equal(lock.flashMessage('success'), 'RDV verrouillé')
    await step.refresh()
    assert.isTrue(step.isLocked)
  })

  test('supprime une étape et ses exercices associés', async ({ client, assert, db }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const step = await SupportPlanStepFactory.merge({ employeeId: employee.id }).create()
    await SupportPlanStepExercise.create({
      supportPlanStepId: step.id,
      exerciseType: EXERCICE_RESULTS_TYPES.VALUES,
      sortOrder: 0,
    })

    const response = await client
      .delete(`${stepsUrl(employee.id)}/${step.id}`)
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    assert.equal(response.flashMessage('success'), 'RDV supprimé')
    await db.assertEmpty('support_plan_steps')
    await db.assertEmpty('support_plan_step_exercises')
  })
})
