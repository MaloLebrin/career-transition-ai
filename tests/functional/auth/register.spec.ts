import Organization from '#models/organization'
import User from '#models/user'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { SESSION_KEY } from '#tests/functional/auth/helpers'
import { createAdvisor, createOrganization } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import hash from '@adonisjs/core/services/hash'
import { test } from '@japa/runner'

/**
 * Inscription publique d'un conseiller : page `Register` (`guest()`) et
 * `POST /auth/register` (start/routes/auth.ts), qui crée l'organisation et le
 * compte puis ouvre la session.
 */
function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    email: 'nouveau.conseiller@example.com',
    password: 'secret123',
    name: 'Nouveau Conseiller',
    organizationName: 'Cabinet Nouveau',
    role: USERS_ROLES.ADVISOR,
    ...overrides,
  }
}

test.group('Auth — inscription (functional)', (group) => {
  group.each.setup(() => truncateDb())

  test('GET /auth/register rend la page Register pour un invité', async ({ assert, client }) => {
    const response = await client.get('/auth/register').withInertia()

    assertPage(assert, response, 'Register', ['errors', 'flash'])
  })

  test('GET /auth/register redirige un utilisateur connecté vers /dashboard', async ({
    client,
  }) => {
    const advisor = await createAdvisor()

    const response = await client.get('/auth/register').loginAs(advisor).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard')
  })

  test('POST /auth/register crée le conseiller et son organisation, ouvre la session et redirige (303) vers /dashboard', async ({
    assert,
    client,
  }) => {
    const response = await client
      .post('/auth/register')
      .withInertia()
      .form(validPayload())
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', '/dashboard')

    const user = await User.findByOrFail('email', 'nouveau.conseiller@example.com')
    assert.equal(user.role, USERS_ROLES.ADVISOR)
    assert.equal(user.name, 'Nouveau Conseiller')
    assert.isNotNull(user.onboardingCompletedAt)
    assert.isTrue(await hash.verify(user.password, 'secret123'), 'mot de passe hashé une fois')

    const organization = await Organization.findOrFail(user.organizationId)
    assert.equal(organization.name, 'Cabinet Nouveau')

    assert.equal(response.session(SESSION_KEY), user.id)
  })

  test('POST /auth/register refuse tout rôle autre que advisor (pas d’élévation de privilèges)', async ({
    assert,
    client,
  }) => {
    for (const role of [USERS_ROLES.SUPER_ADMIN, USERS_ROLES.ADMIN, USERS_ROLES.EMPLOYEE]) {
      const response = await client
        .post('/auth/register')
        .withInertia()
        .form(validPayload({ role }))
        .redirects(0)

      assertFieldErrors(assert, response, ['role'])
    }

    assert.lengthOf(await User.all(), 0)
    assert.lengthOf(await Organization.all(), 0)
  })

  test('POST /auth/register rejette un payload vide sur tous les champs requis', async ({
    assert,
    client,
  }) => {
    const response = await client.post('/auth/register').withInertia().form({}).redirects(0)

    assertFieldErrors(assert, response, ['email', 'password', 'name', 'organizationName', 'role'])
  })

  test('POST /auth/register rejette un email invalide et un mot de passe trop court', async ({
    assert,
    client,
  }) => {
    const response = await client
      .post('/auth/register')
      .withInertia()
      .form(validPayload({ email: 'pas-un-email', password: '12345' }))
      .redirects(0)

    assertFieldErrors(assert, response, ['email', 'password'])
    assert.lengthOf(await User.all(), 0)
  })

  test('POST /auth/register (JSON) avec un email déjà utilisé renvoie 409 sans rien créer', async ({
    assert,
    client,
  }) => {
    const existing = await createAdvisor()

    const response = await client
      .post('/auth/register')
      .header('Accept', 'application/json')
      .json(validPayload({ email: existing.email }))
      .redirects(0)

    response.assertStatus(409)
    response.assertBody({ message: 'Cet email est déjà utilisé.' })
    assert.isNull(await Organization.findBy('name', 'Cabinet Nouveau'))
    assert.isUndefined(response.session(SESSION_KEY))
  })

  test('POST /auth/register (Inertia) avec un email déjà utilisé : flash erreur + retour arrière', async ({
    client,
  }) => {
    const existing = await createAdvisor()

    const response = await client
      .post('/auth/register')
      .withInertia()
      .header('Referer', '/auth/register')
      .form(validPayload({ email: existing.email }))
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/register')
    response.assertFlashMessage('error', 'Cet email est déjà utilisé.')
  })

  test('POST /auth/register (JSON) avec un nom d’organisation déjà pris renvoie 409', async ({
    assert,
    client,
  }) => {
    const organization = await createOrganization()

    const response = await client
      .post('/auth/register')
      .header('Accept', 'application/json')
      .json(validPayload({ organizationName: `  ${organization.name}  ` }))
      .redirects(0)

    response.assertStatus(409)
    response.assertBody({ message: 'Une organisation avec ce nom existe déjà.' })
    assert.isNull(await User.findBy('email', 'nouveau.conseiller@example.com'))
  })
})
