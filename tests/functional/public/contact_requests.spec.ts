import ContactRequest, { CONTACT_REQUEST_STATUSES } from '#models/contact_request'
import { createAdvisor } from '#tests/support/actors'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Formulaire de contact / demande de démo : `POST /contact-requests`
 * (start/routes/public.ts), public et hors `guest()`.
 */
function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Jeanne Martin',
    email: 'jeanne.martin@example.com',
    phone: '0600000000',
    organization: 'Cabinet Martin',
    message: 'Bonjour, je souhaite une démonstration de la plateforme.',
    type: 'demo',
    ...overrides,
  }
}

test.group('Demandes de contact — POST /contact-requests (functional)', (group) => {
  group.each.setup(() => truncateDb())

  test('enregistre la demande en statut pending et renvoie 201', async ({ assert, client }) => {
    const response = await client
      .post('/contact-requests')
      .header('Accept', 'application/json')
      .json(validPayload())

    response.assertStatus(201)
    const body = response.body()
    assert.isTrue(body.success)

    const saved = await ContactRequest.findOrFail(body.id)
    assert.equal(saved.status, CONTACT_REQUEST_STATUSES.PENDING)
    assert.equal(saved.email, 'jeanne.martin@example.com')
    assert.equal(saved.type, 'demo')
    assert.equal(saved.organization, 'Cabinet Martin')
  })

  test('les champs optionnels (téléphone, organisation) peuvent être omis', async ({
    assert,
    client,
  }) => {
    const payload: Record<string, unknown> = validPayload({ type: 'contact' })
    delete payload.phone
    delete payload.organization

    const response = await client
      .post('/contact-requests')
      .header('Accept', 'application/json')
      .json(payload)

    response.assertStatus(201)
    const saved = await ContactRequest.findOrFail(response.body().id)
    assert.isNull(saved.phone)
    assert.isNull(saved.organization)
  })

  test('reste accessible à un utilisateur connecté (pas de guest())', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client
      .post('/contact-requests')
      .loginAs(advisor)
      .header('Accept', 'application/json')
      .json(validPayload())

    response.assertStatus(201)
  })

  test('rejette (422) un payload invalide sans rien enregistrer', async ({ assert, client }) => {
    const response = await client
      .post('/contact-requests')
      .header('Accept', 'application/json')
      .json({ name: 'J', email: 'pas-un-email', message: 'court', type: 'spam' })

    response.assertStatus(422)
    const fields = (response.body().errors as Array<{ field: string }>).map((e) => e.field).sort()
    assert.deepEqual(fields, ['email', 'message', 'name', 'type'])
    assert.lengthOf(await ContactRequest.all(), 0)
  })
})
