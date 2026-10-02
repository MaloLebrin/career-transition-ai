import { test } from '@japa/runner'
import { ExpertRequestFactory } from '#database/factories/expert_request_factory'
import Employee from '#models/employee'
import ExpertRequest from '#models/expert_request'
import Notification from '#models/notification'
import { EXPERT_REQUEST_PATHS, EXPERT_REQUEST_STATUSES } from '#shared/constants/expert_request'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import {
  createAdmin,
  createAdvisor,
  createB2cCandidate,
  createCandidate,
  createInHouseExpert,
  createSuperAdmin,
} from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'

/**
 * Back-office super admin des demandes d'accompagnement (#105) :
 * - `GET  /dashboard/super-admin/expert-requests`             → liste + équipe interne ;
 * - `POST /dashboard/super-admin/expert-requests/:id/assign`  → expert assigné, 2 notifications ;
 * - `POST /dashboard/super-admin/expert-requests/:id/decline` → refus motivé, candidat prévenu.
 */
const PAGE = 'dashboard/admin/expert_requests/Index'

async function pendingRequestFor(paid = true) {
  const candidate = await createB2cCandidate({ paid })
  const request = await ExpertRequestFactory.merge({
    employeeId: candidate.employee.id,
    organizationId: candidate.employee.organizationId,
    message: 'Je veux construire mon plan.',
  }).create()
  return { ...candidate, request }
}

test.group('Super admin — demandes d’accompagnement : liste', (group) => {
  group.each.setup(() => truncateDb())

  test('liste les demandes (candidat, droit, expert) et l’équipe interne', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const expert = await createInHouseExpert()
    const clientAdvisor = await createAdvisor()
    const pending = await pendingRequestFor(true)
    const accepted = await createB2cCandidate({ paid: true, expert })
    await ExpertRequestFactory.merge({
      employeeId: accepted.employee.id,
      organizationId: accepted.employee.organizationId,
      assignedExpertUserId: expert.id,
      handledByUserId: superAdmin.id,
    })
      .apply('accepted')
      .create()

    const response = await client.get(EXPERT_REQUEST_PATHS.admin).loginAs(superAdmin).withInertia()

    const props = assertPage(assert, response, PAGE, ['requests', 'experts'])
    const requests = props.requests as Array<{
      id: number
      status: string
      candidate: { id: number; name: string; hasPaidAccess: boolean }
      assignedExpert: { id: number; name: string } | null
      handledBy: { id: number } | null
    }>
    assert.lengthOf(requests, 2)
    const pendingRow = requests.find((r) => r.id === pending.request.id)!
    assert.equal(pendingRow.status, EXPERT_REQUEST_STATUSES.PENDING)
    assert.deepEqual(pendingRow.candidate, {
      id: pending.employee.id,
      name: pending.employee.name,
      email: pending.employee.email,
      hasPaidAccess: true,
    } as unknown as (typeof pendingRow)['candidate'])
    assert.isNull(pendingRow.assignedExpert)
    const acceptedRow = requests.find((r) => r.id !== pending.request.id)!
    assert.deepEqual(acceptedRow.assignedExpert, { id: expert.id, name: expert.name })
    assert.equal(acceptedRow.handledBy?.id, superAdmin.id)

    const experts = props.experts as Array<{ id: number; assignedCandidatesCount: number }>
    assert.deepEqual(
      experts.map((e) => e.id),
      [expert.id]
    )
    assert.equal(experts[0].assignedCandidatesCount, 1)
    assert.notInclude(JSON.stringify(experts), String(clientAdvisor.id))
  })

  test('refuse un admin de cabinet (403) et un invité (redirection)', async ({ client }) => {
    const forbidden = await client
      .get(EXPERT_REQUEST_PATHS.admin)
      .loginAs(await createAdmin())
      .redirects(0)
    forbidden.assertStatus(403)

    const guest = await client.get(EXPERT_REQUEST_PATHS.admin).redirects(0)
    guest.assertStatus(302)
  })
})

test.group('Super admin — demandes d’accompagnement : assignation et refus', (group) => {
  group.each.setup(() => truncateDb())

  test('assign : advisor_id posé, demande acceptée, candidat et expert prévenus', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const expert = await createInHouseExpert()
    const { user, employee, request } = await pendingRequestFor()

    const response = await client
      .post(EXPERT_REQUEST_PATHS.adminAssign(request.id))
      .loginAs(superAdmin)
      .form({ expertUserId: expert.id })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', EXPERT_REQUEST_PATHS.admin)
    response.assertFlashMessage(
      'success',
      'Expert assigné : le candidat et l’expert sont prévenus.'
    )

    const updatedEmployee = await Employee.findOrFail(employee.id)
    assert.equal(updatedEmployee.advisorId, expert.id)
    const updated = await ExpertRequest.findOrFail(request.id)
    assert.equal(updated.status, EXPERT_REQUEST_STATUSES.ACCEPTED)
    assert.equal(updated.assignedExpertUserId, expert.id)
    assert.equal(updated.handledByUserId, superAdmin.id)
    assert.isNotNull(updated.handledAt)

    const [candidateNotification] = await Notification.query().where('userId', user.id)
    assert.equal(candidateNotification.type, NOTIFICATION_TYPES.EXPERT_ASSIGNED)
    assert.include(candidateNotification.title, expert.name)
    const [expertNotification] = await Notification.query().where('userId', expert.id)
    assert.equal(expertNotification.type, NOTIFICATION_TYPES.CANDIDATE_ASSIGNED)
    assert.deepEqual(expertNotification.meta, {
      employeeId: employee.id,
      href: `/dashboard/conseiller/employees/${employee.id}`,
    })
    assert.notInclude(`${expertNotification.title} ${expertNotification.body}`, employee.name)
  })

  test('assign : 422 pour un utilisateur hors équipe interne, 409 si déjà traitée, 404 inconnue', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const clientAdvisor = await createAdvisor()
    const b2b = await createCandidate()
    const { employee, request } = await pendingRequestFor()

    for (const expertUserId of [clientAdvisor.id, b2b.user.id, 999_999]) {
      const response = await client
        .post(EXPERT_REQUEST_PATHS.adminAssign(request.id))
        .loginAs(superAdmin)
        .header('Accept', 'application/json')
        .form({ expertUserId })
        .redirects(0)
      response.assertStatus(422)
    }
    const untouched = await Employee.findOrFail(employee.id)
    assert.isNull(untouched.advisorId)

    const expert = await createInHouseExpert()
    await ExpertRequest.query().where('id', request.id).update({
      status: EXPERT_REQUEST_STATUSES.DECLINED,
    })
    const conflict = await client
      .post(EXPERT_REQUEST_PATHS.adminAssign(request.id))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .form({ expertUserId: expert.id })
      .redirects(0)
    conflict.assertStatus(409)

    const missing = await client
      .post(EXPERT_REQUEST_PATHS.adminAssign(999_999))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .form({ expertUserId: expert.id })
      .redirects(0)
    missing.assertStatus(404)
  })

  test('decline : motif enregistré et transmis au candidat', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    const { user, request } = await pendingRequestFor()

    const response = await client
      .post(EXPERT_REQUEST_PATHS.adminDecline(request.id))
      .loginAs(superAdmin)
      .form({ reason: 'Aucun expert disponible avant septembre.' })
      .redirects(0)

    response.assertStatus(302)
    response.assertFlashMessage('success', 'Demande refusée : le candidat est prévenu.')
    const updated = await ExpertRequest.findOrFail(request.id)
    assert.equal(updated.status, EXPERT_REQUEST_STATUSES.DECLINED)
    assert.equal(updated.declineReason, 'Aucun expert disponible avant septembre.')
    assert.equal(updated.handledByUserId, superAdmin.id)

    const [notification] = await Notification.query().where('userId', user.id)
    assert.equal(notification.type, NOTIFICATION_TYPES.EXPERT_REQUEST_DECLINED)
    assert.include(notification.body, 'Aucun expert disponible avant septembre.')
    assert.deepEqual(notification.meta, {
      employeeId: updated.employeeId,
      href: EXPERT_REQUEST_PATHS.page,
    })
  })

  test('decline : motif obligatoire (validation)', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    const { request } = await pendingRequestFor()

    const response = await client
      .post(EXPERT_REQUEST_PATHS.adminDecline(request.id))
      .loginAs(superAdmin)
      .withInertia()
      .header('referer', EXPERT_REQUEST_PATHS.admin)
      .form({ reason: '' })
      .redirects(0)

    assertFieldErrors(assert, response, ['reason'])
    const untouched = await ExpertRequest.findOrFail(request.id)
    assert.equal(untouched.status, EXPERT_REQUEST_STATUSES.PENDING)
  })

  test('assign et decline refusés à un conseiller ou un admin (403)', async ({
    client,
    assert,
  }) => {
    const expert = await createInHouseExpert()
    const { request } = await pendingRequestFor()

    for (const actor of [await createAdvisor(), await createAdmin()]) {
      const assign = await client
        .post(EXPERT_REQUEST_PATHS.adminAssign(request.id))
        .loginAs(actor)
        .form({ expertUserId: expert.id })
        .redirects(0)
      assign.assertStatus(403)
      const decline = await client
        .post(EXPERT_REQUEST_PATHS.adminDecline(request.id))
        .loginAs(actor)
        .form({ reason: 'Non.' })
        .redirects(0)
      decline.assertStatus(403)
    }
    const untouched = await ExpertRequest.findOrFail(request.id)
    assert.equal(untouched.status, EXPERT_REQUEST_STATUSES.PENDING)
  })
})
