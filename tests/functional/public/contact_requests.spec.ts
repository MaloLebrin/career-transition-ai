import ContactRequest, { CONTACT_REQUEST_STATUSES } from '#models/contact_request'
import { createAdvisor } from '#tests/support/actors'
import { inertiaErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Formulaire de contact / demande de démo : `POST /contact-requests`
 * (start/routes/public.ts), public et hors `guest()`.
 *
 * Soumis par `useForm` (Inertia) : la réponse est une redirection vers la page
 * d'origine, jamais du JSON (régression #62 : `response.created({...})` cassait
 * le formulaire).
 */
const ORIGIN = '/offre'
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

  test('enregistre la demande en statut pending et redirige vers la page d’origine', async ({
    assert,
    client,
  }) => {
    const response = await client
      .post('/contact-requests')
      .withInertia()
      .header('referer', ORIGIN)
      .json(validPayload())
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', ORIGIN)
    assert.equal(response.flashMessage('success'), 'Votre message a bien été envoyé.')

    const saved = await ContactRequest.findByOrFail('email', 'jeanne.martin@example.com')
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
      .withInertia()
      .header('referer', ORIGIN)
      .json(payload)
      .redirects(0)

    response.assertStatus(302)
    const saved = await ContactRequest.findByOrFail('email', 'jeanne.martin@example.com')
    assert.isNull(saved.phone)
    assert.isNull(saved.organization)
  })

  test('reste accessible à un utilisateur connecté (pas de guest())', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client
      .post('/contact-requests')
      .loginAs(advisor)
      .withInertia()
      .header('referer', ORIGIN)
      .json(validPayload())
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', ORIGIN)
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

  test('Inertia : un payload invalide renvoie les erreurs de champ sans rien enregistrer', async ({
    assert,
    client,
  }) => {
    const response = await client
      .post('/contact-requests')
      .withInertia()
      .header('referer', ORIGIN)
      .json({ name: 'J', email: 'pas-un-email', message: 'court', type: 'spam' })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', ORIGIN)
    assert.sameMembers(Object.keys(inertiaErrors(response)), ['email', 'message', 'name', 'type'])
    assert.lengthOf(await ContactRequest.all(), 0)
  })
})
