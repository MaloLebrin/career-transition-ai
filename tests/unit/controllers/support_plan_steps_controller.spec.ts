import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import SupportPlanStepsController from '#controllers/support_plan_steps_controller'
import type Employee from '#models/employee'
import SupportPlanStep from '#models/support_plan_step'
import SupportPlanStepExercise from '#models/support_plan_step_exercise'
import type User from '#models/user'
import { SupportPlanStepFactory } from '#database/factories/support_plan_step_factory'
import { SupportPlanStepExerciseFactory } from '#database/factories/support_plan_step_exercise_factory'
import { APPOINTMENTS_STATUSES } from '#shared/constants/appointment'
import { EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'
import {
  createAdmin,
  createAdvisor,
  createCandidate,
  createEmployeeFor,
} from '#tests/support/actors'
import { createStepValidator } from '#validators/support_plan_step/create_step_validator'
import { updateStepValidator } from '#validators/support_plan_step/update_step_validator'
import { DateTime } from 'luxon'

/**
 * Unit — `SupportPlanStepsController`. Le contrôleur n'a pas encore de service
 * (requêtes Lucid inline, dette figée dans `controllers_thin.spec.ts`) : les
 * specs touchent donc la base, isolée par une transaction globale par test.
 * Le contexte HTTP reste factice (réponses enregistrées, pas de serveur).
 */

function makeSession() {
  const flashes: Array<[string, string]> = []
  return {
    flashes,
    flash(key: string, value: string) {
      flashes.push([key, value])
    },
  }
}

function makeResponse() {
  const state = {
    redirectedBack: false,
    forbidden: undefined as unknown,
    notFound: undefined as unknown,
  }
  return {
    state,
    redirect() {
      return {
        back() {
          state.redirectedBack = true
        },
      }
    },
    forbidden(body: unknown) {
      state.forbidden = body
    },
    notFound(body: unknown) {
      state.notFound = body
    },
  }
}

function makeContext(user: User, params: Record<string, unknown>, payload: unknown = {}) {
  const validators: unknown[] = []
  const session = makeSession()
  const response = makeResponse()
  const ctx = {
    auth: { user },
    params,
    request: {
      validateUsing(validator: unknown) {
        validators.push(validator)
        return Promise.resolve(payload)
      },
    },
    response,
    session,
  } as any
  return { ctx, session, response, validators }
}

/** Notifications du candidat (#70) enregistrées au lieu d'être envoyées. */
const notified: Array<[string, number]> = []
const fakeCandidateNotifications = {
  async stepUnlocked(_employee: Employee, step: SupportPlanStep) {
    notified.push(['stepUnlocked', step.id])
  },
  async appointmentScheduled(_employee: Employee, step: SupportPlanStep) {
    notified.push(['appointmentScheduled', step.id])
  },
}

const controller = new SupportPlanStepsController(fakeCandidateNotifications as any)

let advisor: User
let employee: Employee

async function seed() {
  notified.length = 0
  advisor = await createAdvisor()
  employee = await createEmployeeFor(advisor)
}

function createStep(overrides: Partial<SupportPlanStep> = {}) {
  return SupportPlanStepFactory.merge({
    employeeId: employee.id,
    advisorId: advisor.id,
    ...overrides,
  }).create()
}

test.group('SupportPlanStepsController.store', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(seed)

  test('crée le RDV avec les valeurs par défaut et ses exercices associés', async ({ assert }) => {
    await createStep({ sortOrder: 4 })
    const payload = {
      title: 'Bilan',
      scheduledAt: '2026-10-01T10:00:00.000Z',
      associatedExercises: [EXERCICE_RESULTS_TYPES.VALUES, EXERCICE_RESULTS_TYPES.DISC],
    }
    const { ctx, session, response, validators } = makeContext(
      advisor,
      { id: String(employee.id) },
      payload
    )

    await controller.store(ctx)

    assert.deepEqual(validators, [createStepValidator])
    const step = await SupportPlanStep.query()
      .where('employeeId', employee.id)
      .where('title', 'Bilan')
      .preload('exercises', (q) => q.orderBy('sortOrder'))
      .firstOrFail()
    assert.equal(step.advisorId, advisor.id)
    assert.equal(step.sortOrder, 5)
    assert.equal(step.status, APPOINTMENTS_STATUSES.SCHEDULED)
    assert.isTrue(step.isLocked)
    assert.isFalse(step.completed)
    assert.isNull(step.dueDate)
    assert.equal(step.scheduledAt?.toUTC().toISO(), '2026-10-01T10:00:00.000Z')
    assert.deepEqual(
      step.exercises.map((e) => [e.exerciseType, e.sortOrder]),
      [
        [EXERCICE_RESULTS_TYPES.VALUES, 0],
        [EXERCICE_RESULTS_TYPES.DISC, 1],
      ]
    )
    assert.deepEqual(session.flashes, [['success', 'RDV créé']])
    assert.isTrue(response.state.redirectedBack)
  })

  test('premier RDV du candidat : sortOrder 0, sortOrder explicite respecté', async ({
    assert,
  }) => {
    const first = makeContext(advisor, { id: String(employee.id) }, { title: 'Premier' })
    await controller.store(first.ctx)
    const second = makeContext(
      advisor,
      { id: String(employee.id) },
      { title: 'Explicite', sortOrder: 10, isLocked: false }
    )
    await controller.store(second.ctx)

    const steps = await SupportPlanStep.query()
      .where('employeeId', employee.id)
      .orderBy('sortOrder')
    assert.deepEqual(
      steps.map((s) => [s.title, s.sortOrder, s.isLocked]),
      [
        ['Premier', 0, true],
        ['Explicite', 10, false],
      ]
    )
  })

  test('un admin de la même organisation peut créer un RDV', async ({ assert }) => {
    const admin = await createAdmin(await advisor.related('organization').query().firstOrFail())
    const { ctx, response } = makeContext(admin, { id: String(employee.id) }, { title: 'Admin' })

    await controller.store(ctx)

    assert.isTrue(response.state.redirectedBack)
    const step = await SupportPlanStep.query().where('title', 'Admin').firstOrFail()
    assert.equal(step.advisorId, admin.id)
  })

  test('refuse un candidat (403) sans rien créer', async ({ assert }) => {
    const { user: candidate } = await createCandidate()
    const { ctx, response, validators } = makeContext(candidate, { id: String(employee.id) })

    await controller.store(ctx)

    assert.deepEqual(response.state.forbidden, { message: 'Only advisors can create steps' })
    assert.lengthOf(validators, 0)
    assert.lengthOf(await SupportPlanStep.query().where('employeeId', employee.id), 0)
  })

  test("404 sur un candidat d'une autre organisation", async ({ assert }) => {
    const otherAdvisor = await createAdvisor()
    const { ctx, response, validators, session } = makeContext(
      otherAdvisor,
      { id: String(employee.id) },
      { title: 'Intrus' }
    )

    await controller.store(ctx)

    assert.deepEqual(response.state.notFound, { message: 'Employee not found' })
    assert.lengthOf(validators, 0)
    assert.lengthOf(session.flashes, 0)
    assert.lengthOf(await SupportPlanStep.query().where('employeeId', employee.id), 0)
  })
})

test.group('SupportPlanStepsController.update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(seed)

  test('met à jour les champs fournis et remplace les exercices', async ({ assert }) => {
    const step = await createStep({ title: 'Avant', description: 'Garder', isLocked: true })
    await SupportPlanStepExerciseFactory.merge({
      supportPlanStepId: step.id,
      exerciseType: EXERCICE_RESULTS_TYPES.MOTIVATION,
      sortOrder: 0,
    }).create()
    const payload = {
      title: 'Après',
      endedAt: '2026-10-02T09:30:00.000Z',
      status: APPOINTMENTS_STATUSES.COMPLETED,
      completed: true,
      isLocked: false,
      notes: 'RAS',
      associatedExercises: [EXERCICE_RESULTS_TYPES.TARGETING],
    }
    const { ctx, session, response, validators } = makeContext(
      advisor,
      { id: String(employee.id), stepId: String(step.id) },
      payload
    )

    await controller.update(ctx)

    assert.deepEqual(validators, [updateStepValidator])
    await step.refresh()
    assert.equal(step.title, 'Après')
    assert.equal(step.description, 'Garder')
    assert.equal(step.status, APPOINTMENTS_STATUSES.COMPLETED)
    assert.isTrue(step.completed)
    assert.isFalse(step.isLocked)
    assert.equal(step.notes, 'RAS')
    assert.equal(step.endedAt?.toUTC().toISO(), '2026-10-02T09:30:00.000Z')

    const exercises = await SupportPlanStepExercise.query().where('supportPlanStepId', step.id)
    assert.deepEqual(
      exercises.map((e) => e.exerciseType),
      [EXERCICE_RESULTS_TYPES.TARGETING]
    )
    assert.deepEqual(session.flashes, [['success', 'RDV mis à jour']])
    assert.isTrue(response.state.redirectedBack)
  })

  test('une liste d’exercices vide supprime les exercices ; absente, les conserve', async ({
    assert,
  }) => {
    const step = await createStep()
    await SupportPlanStepExerciseFactory.merge({
      supportPlanStepId: step.id,
      exerciseType: EXERCICE_RESULTS_TYPES.DISC,
      sortOrder: 0,
    }).create()
    const params = { id: String(employee.id), stepId: String(step.id) }

    await controller.update(makeContext(advisor, params, { title: 'Sans toucher' }).ctx)
    assert.lengthOf(await SupportPlanStepExercise.query().where('supportPlanStepId', step.id), 1)

    await controller.update(makeContext(advisor, params, { associatedExercises: [] }).ctx)
    assert.lengthOf(await SupportPlanStepExercise.query().where('supportPlanStepId', step.id), 0)
  })

  test('refuse un candidat (403)', async ({ assert }) => {
    const step = await createStep({ title: 'Intact' })
    const { user: candidate } = await createCandidate()
    const { ctx, response } = makeContext(
      candidate,
      { id: String(employee.id), stepId: String(step.id) },
      { title: 'Piraté' }
    )

    await controller.update(ctx)

    assert.deepEqual(response.state.forbidden, { message: 'Only advisors can update steps' })
    await step.refresh()
    assert.equal(step.title, 'Intact')
  })

  test("404 sur un candidat d'une autre organisation", async ({ assert }) => {
    const step = await createStep({ title: 'Intact' })
    const otherAdvisor = await createAdvisor()
    const { ctx, response } = makeContext(
      otherAdvisor,
      { id: String(employee.id), stepId: String(step.id) },
      { title: 'Piraté' }
    )

    await controller.update(ctx)

    assert.deepEqual(response.state.notFound, { message: 'Employee not found' })
    await step.refresh()
    assert.equal(step.title, 'Intact')
  })

  test("404 sur un RDV qui n'appartient pas au candidat de la route", async ({ assert }) => {
    const otherEmployee = await createEmployeeFor(advisor)
    const foreignStep = await SupportPlanStepFactory.merge({
      employeeId: otherEmployee.id,
      title: 'Intact',
    }).create()
    const { ctx, response, validators } = makeContext(
      advisor,
      { id: String(employee.id), stepId: String(foreignStep.id) },
      { title: 'Piraté' }
    )

    await controller.update(ctx)

    assert.deepEqual(response.state.notFound, { message: 'Step not found' })
    assert.lengthOf(validators, 0)
    await foreignStep.refresh()
    assert.equal(foreignStep.title, 'Intact')
  })
})

test.group('SupportPlanStepsController.destroy', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(seed)

  test('supprime le RDV du candidat', async ({ assert }) => {
    const step = await createStep()
    const { ctx, session, response } = makeContext(advisor, {
      id: String(employee.id),
      stepId: String(step.id),
    })

    await controller.destroy(ctx)

    assert.isNull(await SupportPlanStep.find(step.id))
    assert.deepEqual(session.flashes, [['success', 'RDV supprimé']])
    assert.isTrue(response.state.redirectedBack)
  })

  test('refuse un candidat (403)', async ({ assert }) => {
    const step = await createStep()
    const { user: candidate } = await createCandidate()
    const { ctx, response } = makeContext(candidate, {
      id: String(employee.id),
      stepId: String(step.id),
    })

    await controller.destroy(ctx)

    assert.deepEqual(response.state.forbidden, { message: 'Only advisors can delete steps' })
    assert.isNotNull(await SupportPlanStep.find(step.id))
  })

  test("404 sur un candidat d'une autre organisation", async ({ assert }) => {
    const step = await createStep()
    const { ctx, response } = makeContext(await createAdvisor(), {
      id: String(employee.id),
      stepId: String(step.id),
    })

    await controller.destroy(ctx)

    assert.deepEqual(response.state.notFound, { message: 'Employee not found' })
    assert.isNotNull(await SupportPlanStep.find(step.id))
  })

  test('404 sur un RDV inexistant', async ({ assert }) => {
    const { ctx, response, session } = makeContext(advisor, {
      id: String(employee.id),
      stepId: '999999',
    })

    await controller.destroy(ctx)

    assert.deepEqual(response.state.notFound, { message: 'Step not found' })
    assert.lengthOf(session.flashes, 0)
  })
})

test.group('SupportPlanStepsController.unlock / lock', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(seed)

  test('unlock déverrouille le RDV', async ({ assert }) => {
    const step = await createStep({ isLocked: true })
    const { ctx, session, response } = makeContext(advisor, {
      id: String(employee.id),
      stepId: String(step.id),
    })

    await controller.unlock(ctx)

    await step.refresh()
    assert.isFalse(step.isLocked)
    assert.deepEqual(session.flashes, [['success', 'RDV déverrouillé']])
    assert.isTrue(response.state.redirectedBack)
  })

  test('lock verrouille le RDV', async ({ assert }) => {
    const step = await createStep({ isLocked: false })
    const { ctx, session, response } = makeContext(advisor, {
      id: String(employee.id),
      stepId: String(step.id),
    })

    await controller.lock(ctx)

    await step.refresh()
    assert.isTrue(step.isLocked)
    assert.deepEqual(session.flashes, [['success', 'RDV verrouillé']])
    assert.isTrue(response.state.redirectedBack)
  })

  test('unlock et lock refusent un candidat (403)', async ({ assert }) => {
    const step = await createStep({ isLocked: true })
    const { user: candidate } = await createCandidate()
    const params = { id: String(employee.id), stepId: String(step.id) }

    const unlock = makeContext(candidate, params)
    await controller.unlock(unlock.ctx)
    assert.deepEqual(unlock.response.state.forbidden, { message: 'Only advisors can unlock steps' })

    const lock = makeContext(candidate, params)
    await controller.lock(lock.ctx)
    assert.deepEqual(lock.response.state.forbidden, { message: 'Only advisors can lock steps' })

    await step.refresh()
    assert.isTrue(step.isLocked)
  })

  test("unlock et lock : 404 sur un candidat d'une autre organisation", async ({ assert }) => {
    const step = await createStep({ isLocked: true })
    const otherAdvisor = await createAdvisor()
    const params = { id: String(employee.id), stepId: String(step.id) }

    const unlock = makeContext(otherAdvisor, params)
    await controller.unlock(unlock.ctx)
    assert.deepEqual(unlock.response.state.notFound, { message: 'Employee not found' })

    const lock = makeContext(otherAdvisor, params)
    await controller.lock(lock.ctx)
    assert.deepEqual(lock.response.state.notFound, { message: 'Employee not found' })

    await step.refresh()
    assert.isTrue(step.isLocked)
  })

  test('unlock et lock : 404 sur un RDV inexistant', async ({ assert }) => {
    const params = { id: String(employee.id), stepId: '999999' }

    const unlock = makeContext(advisor, params)
    await controller.unlock(unlock.ctx)
    assert.deepEqual(unlock.response.state.notFound, { message: 'Step not found' })

    const lock = makeContext(advisor, params)
    await controller.lock(lock.ctx)
    assert.deepEqual(lock.response.state.notFound, { message: 'Step not found' })
  })
})

test.group('SupportPlanStepsController — notifications du candidat (#70)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(seed)

  function stepContext(step: SupportPlanStep, payload: unknown = {}) {
    return makeContext(advisor, { id: String(employee.id), stepId: String(step.id) }, payload)
  }

  test('store : RDV déverrouillé et planifié → étape débloquée + rendez-vous', async ({
    assert,
  }) => {
    const { ctx } = makeContext(
      advisor,
      { id: String(employee.id) },
      { title: 'Bilan', isLocked: false, scheduledAt: '2026-10-01T10:00:00.000Z' }
    )

    await controller.store(ctx)

    const step = await SupportPlanStep.query().where('employeeId', employee.id).firstOrFail()
    assert.deepEqual(notified, [
      ['stepUnlocked', step.id],
      ['appointmentScheduled', step.id],
    ])
  })

  test('store : RDV verrouillé sans date → aucune notification', async ({ assert }) => {
    const { ctx } = makeContext(advisor, { id: String(employee.id) }, { title: 'Bilan' })

    await controller.store(ctx)

    assert.deepEqual(notified, [])
  })

  test('update : déverrouillage et nouvelle date notifient, le reste non', async ({ assert }) => {
    const step = await createStep({ isLocked: true, scheduledAt: null })

    await controller.update(
      stepContext(step, { isLocked: false, scheduledAt: '2026-10-01T10:00:00.000Z' }).ctx
    )
    assert.deepEqual(notified, [
      ['stepUnlocked', step.id],
      ['appointmentScheduled', step.id],
    ])

    notified.length = 0
    // Même date, étape déjà ouverte : rien de nouveau pour le candidat.
    await controller.update(
      stepContext(step, {
        title: 'Renommé',
        isLocked: false,
        scheduledAt: '2026-10-01T10:00:00.000Z',
      }).ctx
    )
    assert.deepEqual(notified, [])
  })

  test('update : rendez-vous déplacé → nouvelle notification', async ({ assert }) => {
    const step = await createStep({
      isLocked: false,
      scheduledAt: DateTime.fromISO('2026-10-01T10:00:00.000Z'),
    })

    await controller.update(stepContext(step, { scheduledAt: '2026-11-05T09:30:00.000Z' }).ctx)

    assert.deepEqual(notified, [['appointmentScheduled', step.id]])
  })

  test('unlock : notifie seulement si l’étape était verrouillée', async ({ assert }) => {
    const locked = await createStep({ isLocked: true })
    const open = await createStep({ isLocked: false })

    await controller.unlock(stepContext(locked).ctx)
    await controller.unlock(stepContext(open).ctx)

    assert.deepEqual(notified, [['stepUnlocked', locked.id]])
  })

  test('lock ne notifie pas', async ({ assert }) => {
    const step = await createStep({ isLocked: false })

    await controller.lock(stepContext(step).ctx)

    assert.deepEqual(notified, [])
  })
})
