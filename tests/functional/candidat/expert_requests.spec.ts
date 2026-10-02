import { test } from '@japa/runner'
import { ExpertRequestFactory } from '#database/factories/expert_request_factory'
import ExpertRequest from '#models/expert_request'
import Notification from '#models/notification'
import {
  EXPERT_REQUEST_PATHS,
  EXPERT_REQUEST_STATUSES,
  EXPERT_SUPPORT_LOCK_REASONS,
} from '#shared/constants/expert_request'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import {
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
 * Demande d'accompagnement par un expert (#103) :
 * - `GET  /dashboard/candidat/accompagnement`  → page (statut, expert, formulaire ou verrou) ;
 * - `POST /dashboard/candidat/expert-requests` → dépôt, super admins notifiés.
 */
const PAGE = 'dashboard/candidat/expert/Index'
const VALID = {
  message: 'Je souhaite être accompagné pour construire mon plan de transition.',
  availability: 'Mardi soir',
}

test.group('Candidat — accompagnement par un expert : page (GET)', (group) => {
  group.each.setup(() => truncateDb())

  test('B2C payé sans demande : éligible, formulaire', async ({ client, assert }) => {
    const { user } = await createB2cCandidate({ paid: true })

    const response = await client.get(EXPERT_REQUEST_PATHS.page).loginAs(user).withInertia()

    const props = assertPage(assert, response, PAGE, ['support'])
    assert.deepEqual(props.support, {
      eligible: true,
      lockedReason: null,
      request: null,
      expert: null,
    })
  })

  test('B2C non payé : verrou « payment »', async ({ client, assert }) => {
    const { user } = await createB2cCandidate()

    const response = await client.get(EXPERT_REQUEST_PATHS.page).loginAs(user).withInertia()

    const support = assertPage(assert, response, PAGE).support as Record<string, unknown>
    assert.isFalse(support.eligible)
    assert.equal(support.lockedReason, EXPERT_SUPPORT_LOCK_REASONS.PAYMENT)
  })

  test('B2B : verrou « b2b », la page reste lisible', async ({ client, assert }) => {
    const { user } = await createCandidate()

    const response = await client.get(EXPERT_REQUEST_PATHS.page).loginAs(user).withInertia()

    const support = assertPage(assert, response, PAGE).support as Record<string, unknown>
    assert.isFalse(support.eligible)
    assert.equal(support.lockedReason, EXPERT_SUPPORT_LOCK_REASONS.B2B)
  })

  test('demande en attente et expert assigné : exposés (nom seul)', async ({ client, assert }) => {
    const expert = await createInHouseExpert()
    const { user, employee } = await createB2cCandidate({ paid: true, expert })
    const request = await ExpertRequestFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
      message: 'Mon message',
    })
      .apply('accepted')
      .create()

    const response = await client.get(EXPERT_REQUEST_PATHS.page).loginAs(user).withInertia()

    const support = assertPage(assert, response, PAGE).support as {
      request: { id: number; status: string; message: string }
      expert: Record<string, unknown>
    }
    assert.equal(support.request.id, request.id)
    assert.equal(support.request.status, EXPERT_REQUEST_STATUSES.ACCEPTED)
    assert.equal(support.request.message, 'Mon message')
    assert.deepEqual(support.expert, { name: expert.name })
    assert.notInclude(JSON.stringify(support), expert.email)
  })

  test('refuse un conseiller (403) et renvoie l’invité vers la connexion', async ({ client }) => {
    const forbidden = await client
      .get(EXPERT_REQUEST_PATHS.page)
      .loginAs(await createAdvisor())
      .redirects(0)
    forbidden.assertStatus(403)

    const guest = await client.get(EXPERT_REQUEST_PATHS.page).redirects(0)
    guest.assertStatus(302)
    guest.assertHeader('location', '/auth/login')
  })
})

test.group('Candidat — accompagnement par un expert : dépôt (POST)', (group) => {
  group.each.setup(() => truncateDb())

  test('B2C payé : crée la demande et notifie les super admins (id seulement)', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const { user, employee } = await createB2cCandidate({ paid: true })

    const response = await client
      .post(EXPERT_REQUEST_PATHS.create)
      .loginAs(user)
      .form(VALID)
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', EXPERT_REQUEST_PATHS.page)
    response.assertFlashMessage(
      'success',
      'Votre demande est envoyée : un expert vous contactera prochainement.'
    )

    const [request] = await ExpertRequest.query().where('employeeId', employee.id)
    assert.equal(request.status, EXPERT_REQUEST_STATUSES.PENDING)
    assert.equal(request.message, VALID.message)
    assert.equal(request.availability, 'Mardi soir')
    assert.equal(request.organizationId, employee.organizationId)

    const [notification] = await Notification.query()
      .where('userId', superAdmin.id)
      .where('type', NOTIFICATION_TYPES.EXPERT_REQUEST_CREATED)
    assert.deepEqual(notification.meta, {
      employeeId: employee.id,
      expertRequestId: request.id,
      href: EXPERT_REQUEST_PATHS.admin,
    })
    assert.notInclude(`${notification.title} ${notification.body}`, employee.name)
    assert.notInclude(`${notification.title} ${notification.body}`, employee.email)
    assert.lengthOf(await Notification.query().where('userId', user.id), 0)
  })

  test('doublon : 409 tant qu’une demande est en attente', async ({ client, assert }) => {
    const { user } = await createB2cCandidate({ paid: true })
    await client.post(EXPERT_REQUEST_PATHS.create).loginAs(user).form(VALID).redirects(0)

    const response = await client
      .post(EXPERT_REQUEST_PATHS.create)
      .loginAs(user)
      .header('Accept', 'application/json')
      .form(VALID)
      .redirects(0)

    response.assertStatus(409)
    assert.lengthOf(await ExpertRequest.all(), 1)
  })

  test('après un refus, une nouvelle demande est possible', async ({ client, assert }) => {
    const { user, employee } = await createB2cCandidate({ paid: true })
    await ExpertRequestFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    })
      .apply('declined')
      .create()

    const response = await client
      .post(EXPERT_REQUEST_PATHS.create)
      .loginAs(user)
      .form(VALID)
      .redirects(0)

    response.assertStatus(302)
    assert.lengthOf(await ExpertRequest.query().where('employeeId', employee.id), 2)
  })

  test('B2C non payé : 403, rien n’est créé ; en Inertia, flash + retour', async ({
    client,
    assert,
  }) => {
    const { user } = await createB2cCandidate()

    const json = await client
      .post(EXPERT_REQUEST_PATHS.create)
      .loginAs(user)
      .header('Accept', 'application/json')
      .form(VALID)
      .redirects(0)
    json.assertStatus(403)

    const inertia = await client
      .post(EXPERT_REQUEST_PATHS.create)
      .loginAs(user)
      .withInertia()
      .header('referer', EXPERT_REQUEST_PATHS.page)
      .form(VALID)
      .redirects(0)
    inertia.assertStatus(302)
    inertia.assertHeader('location', EXPERT_REQUEST_PATHS.page)
    inertia.assertFlashMessage(
      'error',
      'L’accompagnement par un expert est réservé au forfait : réglez-le d’abord.'
    )
    assert.lengthOf(await ExpertRequest.all(), 0)
  })

  test('B2B : 403, rien n’est créé', async ({ client, assert }) => {
    const { user } = await createCandidate()

    const response = await client
      .post(EXPERT_REQUEST_PATHS.create)
      .loginAs(user)
      .header('Accept', 'application/json')
      .form(VALID)
      .redirects(0)

    response.assertStatus(403)
    assert.lengthOf(await ExpertRequest.all(), 0)
  })

  test('validation : message trop court ou absent', async ({ client, assert }) => {
    const { user } = await createB2cCandidate({ paid: true })

    const response = await client
      .post(EXPERT_REQUEST_PATHS.create)
      .loginAs(user)
      .withInertia()
      .header('referer', EXPERT_REQUEST_PATHS.page)
      .form({ message: 'court' })
      .redirects(0)

    assertFieldErrors(assert, response, ['message'])
    assert.lengthOf(await ExpertRequest.all(), 0)
  })

  test('refuse un conseiller (403)', async ({ client, assert }) => {
    const response = await client
      .post(EXPERT_REQUEST_PATHS.create)
      .loginAs(await createAdvisor())
      .form(VALID)
      .redirects(0)

    response.assertStatus(403)
    assert.lengthOf(await ExpertRequest.all(), 0)
  })
})
