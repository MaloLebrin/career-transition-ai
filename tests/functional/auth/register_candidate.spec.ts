import Employee from '#models/employee'
import Organization from '#models/organization'
import User from '#models/user'
import { B2C_REGISTRATION_CLOSED_MESSAGE } from '#middleware/registration_open_middleware'
import { ACCOUNT_TYPES } from '#shared/constants/b2c'
import { EMPLOYEES_STATUS } from '#shared/constants/employee'
import { TERMS_VERSION } from '#shared/constants/legal'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { SESSION_KEY } from '#tests/functional/auth/helpers'
import { fakeMail, restoreMail } from '#tests/functional/conseiller/helpers'
import { createAdvisor, createCandidate, createPlatformOrganization } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import config from '@adonisjs/core/services/config'
import hash from '@adonisjs/core/services/hash'
import { test } from '@japa/runner'

/**
 * Inscription d'un particulier (#93) : page `RegisterCandidate` (`/inscription`,
 * `guest()` + `registrationOpen({ kind: 'candidate' })`) et
 * `POST /auth/register/candidat`, qui crée le compte `employee` et la fiche
 * `b2c` dans l'organisation plateforme puis ouvre la session.
 */
const PAGE_URL = '/inscription'
const POST_URL = '/auth/register/candidat'

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    email: 'camille.durand@example.com',
    password: 'motdepasse-8',
    name: 'Camille Durand',
    acceptTerms: 'on',
    ...overrides,
  }
}

test.group('Auth — inscription particulier (functional)', (group) => {
  // `truncateDb()` rend la fonction de nettoyage que Japa exécute au teardown.
  group.each.setup(async () => {
    const truncate = await truncateDb()
    await createPlatformOrganization()
    return truncate
  })
  // Le lien de vérification d'e-mail (#98) part à l'inscription : on l'enregistre
  // au lieu de l'envoyer (bruit console). Assertions dans `email_verification.spec.ts`.
  group.each.setup(() => {
    fakeMail()
    return () => restoreMail()
  })

  test('GET /inscription rend la page RegisterCandidate pour un invité', async ({
    assert,
    client,
  }) => {
    const response = await client.get(PAGE_URL).withInertia()

    assertPage(assert, response, 'RegisterCandidate', ['errors', 'flash'])
  })

  test('la page de connexion reçoit b2cRegistrationEnabled=true', async ({ assert, client }) => {
    const response = await client.get('/auth/login').withInertia()

    const props = assertPage(assert, response, 'Login', ['b2cRegistrationEnabled'])
    assert.isTrue(props.b2cRegistrationEnabled)
  })

  test('GET /inscription redirige un utilisateur connecté vers /dashboard', async ({ client }) => {
    const { user } = await createCandidate()

    const response = await client.get(PAGE_URL).loginAs(user).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard')
  })

  test('POST crée le compte employee et la fiche b2c dans l’organisation plateforme, ouvre la session et redirige (303) vers /dashboard', async ({
    assert,
    client,
  }) => {
    const platform = await createPlatformOrganization()

    const response = await client.post(POST_URL).withInertia().form(validPayload()).redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', '/dashboard')

    const user = await User.findByOrFail('email', 'camille.durand@example.com')
    assert.equal(user.role, USERS_ROLES.EMPLOYEE)
    assert.equal(user.organizationId, platform.id)
    assert.equal(user.name, 'Camille Durand')
    assert.isNotNull(user.onboardingCompletedAt)
    assert.isNotNull(user.termsAcceptedAt)
    assert.equal(user.termsVersion, TERMS_VERSION)
    assert.isNull(user.emailVerifiedAt)
    assert.isTrue(await hash.verify(user.password, 'motdepasse-8'), 'mot de passe hashé une fois')

    const employee = await Employee.findByOrFail('userId', user.id)
    assert.equal(employee.organizationId, platform.id)
    assert.equal(employee.accountType, ACCOUNT_TYPES.B2C)
    assert.isNull(employee.advisorId)
    assert.isFalse(employee.onboarded)
    assert.equal(employee.status, EMPLOYEES_STATUS.ONBOARDING)
    assert.equal(employee.email, user.email)
    assert.equal(employee.name, user.name)

    assert.equal(response.session(SESSION_KEY), user.id)
  })

  test('le nouvel inscrit est envoyé vers l’onboarding candidat existant', async ({ client }) => {
    await client.post(POST_URL).withInertia().form(validPayload()).redirects(0)
    const user = await User.findByOrFail('email', 'camille.durand@example.com')

    const response = await client.get('/dashboard/candidat').loginAs(user).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/candidat/onboarding')
  })

  test('POST ignore tout rôle ou organisation glissés dans le payload', async ({
    assert,
    client,
  }) => {
    const platform = await createPlatformOrganization()

    await client
      .post(POST_URL)
      .withInertia()
      .form(
        validPayload({ role: USERS_ROLES.SUPER_ADMIN, organizationId: 999, accountType: 'b2b' })
      )
      .redirects(0)

    const user = await User.findByOrFail('email', 'camille.durand@example.com')
    assert.equal(user.role, USERS_ROLES.EMPLOYEE)
    assert.equal(user.organizationId, platform.id)
    const employee = await Employee.findByOrFail('userId', user.id)
    assert.equal(employee.accountType, ACCOUNT_TYPES.B2C)
  })

  test('POST sans case CGU cochée est refusé et ne crée rien', async ({ assert, client }) => {
    const rejected = [undefined, '', 'off', '0', 'false']
    for (const [i, acceptTerms] of rejected.entries()) {
      // Une IP par essai : au-delà de 3 inscriptions par heure, `throttleRegister` répondrait.
      const response = await client
        .post(POST_URL)
        .header('X-Forwarded-For', `203.0.113.${100 + i}`)
        .withInertia()
        .form(validPayload({ acceptTerms }))
        .redirects(0)

      assertFieldErrors(assert, response, ['acceptTerms'])
    }

    assert.lengthOf(await User.all(), 0)
    assert.lengthOf(await Employee.all(), 0)
  })

  test('POST rejette un payload vide sur tous les champs requis', async ({ assert, client }) => {
    const response = await client.post(POST_URL).withInertia().form({}).redirects(0)

    assertFieldErrors(assert, response, ['email', 'password', 'name', 'acceptTerms'])
  })

  test('POST rejette un email invalide et un mot de passe de moins de 8 caractères', async ({
    assert,
    client,
  }) => {
    const response = await client
      .post(POST_URL)
      .withInertia()
      .form(validPayload({ email: 'pas-un-email', password: 'court7!' }))
      .redirects(0)

    assertFieldErrors(assert, response, ['email', 'password'])
    assert.lengthOf(await User.all(), 0)
  })

  test('POST (JSON) avec un email déjà utilisé, même par un conseiller d’un cabinet, renvoie 409 sans rien créer', async ({
    assert,
    client,
  }) => {
    const existing = await createAdvisor()

    const response = await client
      .post(POST_URL)
      .header('Accept', 'application/json')
      .json(validPayload({ email: existing.email }))
      .redirects(0)

    response.assertStatus(409)
    response.assertBody({ message: 'Cet email est déjà utilisé.' })
    assert.lengthOf(await Employee.all(), 0)
    assert.isUndefined(response.session(SESSION_KEY))
  })

  test('POST (Inertia) avec un email déjà utilisé : flash erreur + retour arrière', async ({
    client,
  }) => {
    const existing = await createAdvisor()

    const response = await client
      .post(POST_URL)
      .withInertia()
      .header('Referer', PAGE_URL)
      .form(validPayload({ email: existing.email }))
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', PAGE_URL)
    response.assertFlashMessage('error', 'Cet email est déjà utilisé.')
  })

  test('POST (JSON) sans organisation plateforme renvoie 503 sans rien créer', async ({
    assert,
    client,
  }) => {
    await Organization.query().where('isPlatform', true).delete()

    const response = await client
      .post(POST_URL)
      .header('Accept', 'application/json')
      .json(validPayload())
      .redirects(0)

    response.assertStatus(503)
    assert.lengthOf(await User.all(), 0)
    assert.isUndefined(response.session(SESSION_KEY))
  })

  test('POST partage le quota d’inscriptions par IP avec /auth/register (3 par heure)', async ({
    assert,
    client,
  }) => {
    for (let i = 0; i < 3; i++) {
      const response = await client
        .post(POST_URL)
        .header('X-Forwarded-For', '203.0.113.93')
        .form(validPayload({ email: `particulier${i}@example.com` }))
        .redirects(0)
      response.assertStatus(303)
    }

    const response = await client
      .post(POST_URL)
      .header('X-Forwarded-For', '203.0.113.93')
      .form(validPayload({ email: 'de.trop@example.com' }))
      .redirects(0)

    response.assertStatus(429)
    assert.isNull(await User.findBy('email', 'de.trop@example.com'))
  })
})

/**
 * Flag fermé (`B2C_REGISTRATION_ENABLED=false`, défaut en production) : la
 * page et la création de compte sont refusées, l'inscription des conseillers
 * reste gouvernée par son propre flag.
 */
test.group('Auth — inscription particulier fermée (functional)', (group) => {
  group.each.setup(async () => {
    const truncate = await truncateDb()
    await createPlatformOrganization()
    const previous = config.get<boolean>('registration.candidateEnabled')
    config.set('registration.candidateEnabled', false)
    return async () => {
      config.set('registration.candidateEnabled', previous)
      await truncate()
    }
  })

  test('GET /inscription ne sert plus la page : redirection vers /auth/login avec un message', async ({
    client,
  }) => {
    const response = await client.get(PAGE_URL).withInertia().redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
    response.assertFlashMessage('error', B2C_REGISTRATION_CLOSED_MESSAGE)
  })

  test('POST renvoie 403 sans créer ni compte ni fiche', async ({ assert, client }) => {
    const response = await client.post(POST_URL).withInertia().form(validPayload()).redirects(0)

    response.assertStatus(403)
    assert.lengthOf(await User.all(), 0)
    assert.lengthOf(await Employee.all(), 0)
    assert.isUndefined(response.session(SESSION_KEY))
  })

  test('la page de connexion reçoit b2cRegistrationEnabled=false, registrationEnabled inchangé', async ({
    assert,
    client,
  }) => {
    const response = await client.get('/auth/login').withInertia()

    const props = assertPage(assert, response, 'Login', [
      'b2cRegistrationEnabled',
      'registrationEnabled',
    ])
    assert.isFalse(props.b2cRegistrationEnabled)
    assert.isTrue(props.registrationEnabled)
  })

  test('l’inscription des conseillers reste ouverte', async ({ client }) => {
    const response = await client.get('/auth/register').withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('Register')
  })
})
