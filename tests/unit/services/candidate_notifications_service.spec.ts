import Notification from '#models/notification'
import { SupportPlanStepFactory } from '#database/factories/support_plan_step_factory'
import {
  CANDIDATE_NOTIFICATION_LINKS,
  CandidateNotificationsService,
} from '#services/candidate_notifications_service'
import { NotificationService } from '#services/notification_service'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import { EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'
import {
  createAdvisor,
  createB2cCandidate,
  createCandidate,
  createEmployeeFor,
  createSuperAdmin,
} from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/**
 * Unit — `CandidateNotificationsService` (#70). Vrai `NotificationService`
 * (queue `sync`, mail console en test) : on vérifie les lignes écrites.
 */
const service = new CandidateNotificationsService(new NotificationService())

test.group('CandidateNotificationsService — parcours du candidat', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('stepUnlocked notifie le compte du candidat avec un lien vers l’étape', async ({
    assert,
  }) => {
    const advisor = await createAdvisor()
    const { user, employee } = await createCandidate({ advisor })
    const step = await SupportPlanStepFactory.merge({
      employeeId: employee.id,
      title: 'Bilan de compétences',
    }).create()

    await service.stepUnlocked(employee, step)

    const [notification] = await Notification.query().where('userId', user.id)
    assert.equal(notification.type, NOTIFICATION_TYPES.STEP_UNLOCKED)
    assert.equal(notification.title, 'Nouvelle étape disponible : Bilan de compétences')
    assert.deepEqual(notification.meta, {
      stepId: step.id,
      href: CANDIDATE_NOTIFICATION_LINKS.step(step.id),
    })
  })

  test('appointmentScheduled donne la date (heure de Paris) et le lieu', async ({ assert }) => {
    const { user, employee } = await createCandidate()
    const step = await SupportPlanStepFactory.merge({
      employeeId: employee.id,
      title: 'Point mensuel',
      scheduledAt: DateTime.fromISO('2026-10-01T08:00:00.000Z'),
      locationOrLink: 'Visio',
    }).create()

    await service.appointmentScheduled(employee, step)

    const [notification] = await Notification.query().where('userId', user.id)
    assert.equal(notification.type, NOTIFICATION_TYPES.APPOINTMENT_SCHEDULED)
    assert.include(notification.title, '1 octobre 2026')
    assert.include(notification.title, '10:00')
    assert.equal(notification.body, 'Rendez-vous : Point mensuel\nLieu ou lien : Visio')
  })

  test('appointmentScheduled ignore une étape sans date', async ({ assert }) => {
    const { user, employee } = await createCandidate()
    const step = await SupportPlanStepFactory.merge({
      employeeId: employee.id,
      scheduledAt: null,
    }).create()

    await service.appointmentScheduled(employee, step)

    assert.lengthOf(await Notification.query().where('userId', user.id), 0)
  })

  test('synthesisShared pointe vers la page synthèse du candidat', async ({ assert }) => {
    const { user, employee } = await createCandidate()

    await service.synthesisShared(employee)

    const [notification] = await Notification.query().where('userId', user.id)
    assert.equal(notification.type, NOTIFICATION_TYPES.SYNTHESIS_SHARED)
    assert.deepEqual(notification.meta, { href: CANDIDATE_NOTIFICATION_LINKS.synthesis })
  })

  test('un candidat sans compte n’est jamais notifié', async ({ assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const step = await SupportPlanStepFactory.merge({
      employeeId: employee.id,
      scheduledAt: DateTime.now(),
    }).create()

    await service.stepUnlocked(employee, step)
    await service.appointmentScheduled(employee, step)
    await service.synthesisShared(employee)

    assert.lengthOf(
      await Notification.query().whereIn('type', [
        NOTIFICATION_TYPES.STEP_UNLOCKED,
        NOTIFICATION_TYPES.APPOINTMENT_SCHEDULED,
        NOTIFICATION_TYPES.SYNTHESIS_SHARED,
      ]),
      0
    )
  })
})

test.group('CandidateNotificationsService.erasureRequested', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('prévient les super admins et le conseiller, sans nom ni e-mail du candidat', async ({
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const advisor = await createAdvisor()
    const { user, employee } = await createCandidate({ advisor })

    await service.erasureRequested(employee)

    const rows = await Notification.query()
      .where('type', NOTIFICATION_TYPES.DATA_ERASURE_REQUESTED)
      .orderBy('userId')
    const recipients = rows.map((row) => row.userId)
    assert.includeMembers(recipients, [superAdmin.id, advisor.id])
    assert.notInclude(recipients, user.id)
    for (const row of rows) {
      assert.include(row.title, `#${employee.id}`)
      assert.notInclude(`${row.title} ${row.body}`, employee.name)
      assert.notInclude(`${row.title} ${row.body}`, employee.email)
      assert.deepEqual(row.meta, { employeeId: employee.id })
    }
  })

  test('sans conseiller : seuls les super admins sont prévenus', async ({ assert }) => {
    const superAdmin = await createSuperAdmin()
    const { employee } = await createCandidate()

    await service.erasureRequested(employee)

    const rows = await Notification.query().where('type', NOTIFICATION_TYPES.DATA_ERASURE_REQUESTED)
    assert.deepEqual(
      rows.map((row) => row.userId),
      [superAdmin.id]
    )
  })
})

test.group('CandidateNotificationsService.aiAnalysisReady (#100)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('notifie un particulier B2C avec un lien vers l’exercice', async ({ assert }) => {
    const { user, employee } = await createB2cCandidate()
    const result = await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.VALUES,
    }).create()

    await service.aiAnalysisReady(employee, result)

    const [notification] = await Notification.query().where('userId', user.id)
    assert.equal(notification.type, NOTIFICATION_TYPES.AI_ANALYSIS_READY_CANDIDATE)
    assert.equal(notification.title, 'Votre analyse IA est disponible')
    assert.deepEqual(notification.meta, {
      exerciseResultId: result.id,
      exerciseType: EXERCICE_RESULTS_TYPES.VALUES,
      href: CANDIDATE_NOTIFICATION_LINKS.exercise(EXERCICE_RESULTS_TYPES.VALUES),
    })
  })

  test('ne notifie pas un candidat B2B (son conseiller est prévenu par le job)', async ({
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    const result = await ExerciseResultFactory.merge({ employeeId: employee.id }).create()

    await service.aiAnalysisReady(employee, result)

    assert.lengthOf(await Notification.query().where('userId', user.id), 0)
  })
})
