import { EmployeeFactory } from '#database/factories/employee_factory'
import { SupportPlanStepFactory } from '#database/factories/support_plan_step_factory'
import Organization from '#models/organization'
import { APPOINTMENTS_STATUSES } from '#shared/constants/appointment'
import {
  createAdmin,
  createAdvisor,
  createB2cCandidate,
  createCandidate,
  createInHouseExpert,
  createOrganization,
} from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/**
 * Accueil du tableau de bord conseiller : GET /dashboard/conseiller
 */
type Accompaniment = {
  employeeId: number
  name: string
  completedSteps: number
  totalSteps: number
  progressPercent: number
  nextAppointment: { stepId: number } | null
}

test.group('Conseiller — accueil', (group) => {
  group.each.setup(() => truncateDb())

  test('calcule les indicateurs et les prochains RDV des candidats suivis', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const active = await EmployeeFactory.merge({
      organizationId: advisor.organizationId,
      advisorId: advisor.id,
      name: 'Alice',
      status: 'active',
      onboarded: true,
    }).create()
    await EmployeeFactory.merge({
      organizationId: advisor.organizationId,
      advisorId: advisor.id,
      name: 'Bruno',
      status: 'on-hold',
      onboarded: false,
    }).create()

    const upcoming = await SupportPlanStepFactory.merge({
      employeeId: active.id,
      status: APPOINTMENTS_STATUSES.SCHEDULED,
      scheduledAt: DateTime.now().plus({ days: 3 }),
      completed: false,
    }).create()
    await SupportPlanStepFactory.merge({
      employeeId: active.id,
      status: APPOINTMENTS_STATUSES.COMPLETED,
      scheduledAt: DateTime.now().minus({ days: 1 }),
      completed: true,
    }).create()

    const response = await client.get('/dashboard/conseiller').loginAs(advisor).withInertia()

    const props = assertPage(assert, response, 'dashboard/conseiller/home/Home', [
      'stats',
      'accompaniments',
      'upcomingAppointments',
    ])
    assert.deepEqual(props.stats, {
      totalActive: 1,
      pendingOnboarding: 1,
      upcomingCount: 1,
      completedStepsThisMonth: 1,
    })

    const accompaniments = props.accompaniments as Accompaniment[]
    // Les candidats actifs d'abord, puis ordre alphabétique
    assert.deepEqual(
      accompaniments.map((a) => a.name),
      ['Alice', 'Bruno']
    )
    assert.include(accompaniments[0], { completedSteps: 1, totalSteps: 2, progressPercent: 50 })
    assert.equal(accompaniments[0].nextAppointment?.stepId, upcoming.id)
    assert.isNull(accompaniments[1].nextAppointment)

    const appointments = props.upcomingAppointments as Array<{ stepId: number }>
    assert.deepEqual(
      appointments.map((a) => a.stepId),
      [upcoming.id]
    )
  })

  test('un conseiller ne voit que ses candidats, un admin toute son organisation', async ({
    client,
    assert,
  }) => {
    const admin = await createAdmin()
    const org = await Organization.findOrFail(admin.organizationId)
    const advisor = await createAdvisor(org)
    await EmployeeFactory.merge({
      organizationId: org.id,
      advisorId: advisor.id,
      name: 'Suivi conseiller',
    }).create()
    await EmployeeFactory.merge({
      organizationId: org.id,
      advisorId: admin.id,
      name: 'Suivi admin',
    }).create()
    const otherOrg = await createOrganization()
    await EmployeeFactory.merge({
      organizationId: otherOrg.id,
      name: 'Autre cabinet',
    }).create()

    const asAdvisor = await client.get('/dashboard/conseiller').loginAs(advisor).withInertia()
    const advisorProps = assertPage(assert, asAdvisor, 'dashboard/conseiller/home/Home')
    assert.deepEqual(
      (advisorProps.accompaniments as Accompaniment[]).map((a) => a.name),
      ['Suivi conseiller']
    )

    const asAdmin = await client.get('/dashboard/conseiller').loginAs(admin).withInertia()
    const adminProps = assertPage(assert, asAdmin, 'dashboard/conseiller/home/Home')
    assert.sameMembers(
      (adminProps.accompaniments as Accompaniment[]).map((a) => a.name),
      ['Suivi conseiller', 'Suivi admin']
    )
  })

  test('un candidat est refusé (403)', async ({ client }) => {
    const { user } = await createCandidate()

    const response = await client.get('/dashboard/conseiller').loginAs(user).redirects(0)

    response.assertStatus(403)
  })
})

test.group('Conseiller — accueil : expert interne (#105)', (group) => {
  group.each.setup(() => truncateDb())

  test('l’expert interne voit le particulier qui lui est assigné, pas les autres B2C', async ({
    client,
    assert,
  }) => {
    const expert = await createInHouseExpert()
    const mine = await createB2cCandidate({ paid: true, expert })
    await createB2cCandidate({ paid: true })

    const response = await client.get('/dashboard/conseiller').loginAs(expert).withInertia()

    const props = assertPage(assert, response, 'dashboard/conseiller/home/Home')
    const accompaniments = props.accompaniments as Accompaniment[]
    assert.deepEqual(
      accompaniments.map((a) => a.employeeId),
      [mine.employee.id]
    )
  })
})
