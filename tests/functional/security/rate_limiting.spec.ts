import ContactRequest from '#models/contact_request'
import User from '#models/user'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { RATE_LIMIT_ERROR_KEY, rateLimitMessage } from '#shared/helpers/rate_limit'
import { PASSWORD, SESSION_KEY, withPassword } from '#tests/functional/auth/helpers'
import { createAdvisor } from '#tests/support/actors'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Rate limiting des endpoints publics (`start/limiter.ts`, issue #23) : au-delà
 * du quota, 429 avec `Retry-After` ; une requête Inertia reçoit un flash +
 * redirect back (`app/exceptions/handler.ts`).
 *
 * Les compteurs sont remis à zéro avant chaque test (`tests/bootstrap.ts`).
 * Chaque test pose sa propre IP via `X-Forwarded-For` (entrée la plus à
 * droite, cf. `clientIp()`).
 */

const LOGIN_LIMIT = 5
const REGISTER_LIMIT = 3
const CONTACT_LIMIT = 3
const ONBOARDING_LIMIT = 10

function contactPayload() {
  return {
    name: 'Jeanne Martin',
    email: 'jeanne.martin@example.com',
    message: 'Bonjour, je souhaite une démonstration de la plateforme.',
    type: 'demo',
  }
}

test.group('Rate limiting — POST /auth/login (functional)', (group) => {
  group.each.setup(() => truncateDb())

  test(`la ${LOGIN_LIMIT + 1}ᵉ tentative en une minute renvoie 429, même avec le bon mot de passe`, async ({
    assert,
    client,
  }) => {
    const advisor = await withPassword(await createAdvisor())

    for (let i = 0; i < LOGIN_LIMIT; i++) {
      const attempt = await client
        .post('/auth/login')
        .header('X-Forwarded-For', '203.0.113.10')
        .form({ email: advisor.email, password: 'mauvais-mot-de-passe' })
        .redirects(0)
      assert.notEqual(attempt.status(), 429)
    }

    const response = await client
      .post('/auth/login')
      .header('X-Forwarded-For', '203.0.113.10')
      .form({ email: advisor.email, password: PASSWORD })
      .redirects(0)

    response.assertStatus(429)
    assert.exists(response.header('retry-after'))
    response.assertHeader('x-ratelimit-limit', String(LOGIN_LIMIT))
    assert.isUndefined(response.session(SESSION_KEY))
  })

  test('le quota est par IP et par e-mail : un autre compte ou une autre IP passe', async ({
    assert,
    client,
  }) => {
    const advisor = await withPassword(await createAdvisor())
    const other = await withPassword(await createAdvisor())

    for (let i = 0; i <= LOGIN_LIMIT; i++) {
      await client
        .post('/auth/login')
        .header('X-Forwarded-For', '203.0.113.11')
        .form({ email: advisor.email, password: 'mauvais-mot-de-passe' })
        .redirects(0)
    }

    const otherAccount = await client
      .post('/auth/login')
      .header('X-Forwarded-For', '203.0.113.11')
      .form({ email: other.email, password: PASSWORD })
      .redirects(0)
    otherAccount.assertStatus(303)
    assert.equal(otherAccount.session(SESSION_KEY), other.id)

    const otherIp = await client
      .post('/auth/login')
      .header('X-Forwarded-For', '203.0.113.12')
      .form({ email: advisor.email, password: PASSWORD })
      .redirects(0)
    otherIp.assertStatus(303)
    assert.equal(otherIp.session(SESSION_KEY), advisor.id)
  })

  test('l’e-mail est normalisé : changer la casse ne remet pas le compteur à zéro', async ({
    client,
  }) => {
    const advisor = await withPassword(await createAdvisor())

    for (let i = 0; i < LOGIN_LIMIT; i++) {
      await client
        .post('/auth/login')
        .header('X-Forwarded-For', '203.0.113.13')
        .form({ email: advisor.email, password: 'mauvais-mot-de-passe' })
        .redirects(0)
    }

    const response = await client
      .post('/auth/login')
      .header('X-Forwarded-For', '203.0.113.13')
      .form({ email: ` ${advisor.email.toUpperCase()} `, password: PASSWORD })
      .redirects(0)

    response.assertStatus(429)
  })

  test('falsifier le début de X-Forwarded-For ne contourne pas la limite', async ({ client }) => {
    const advisor = await withPassword(await createAdvisor())

    // Le client écrit l'entrée de gauche ; le proxy ajoute l'IP vue à droite.
    for (let i = 0; i < LOGIN_LIMIT; i++) {
      await client
        .post('/auth/login')
        .header('X-Forwarded-For', `198.51.100.${i}, 203.0.113.14`)
        .form({ email: advisor.email, password: 'mauvais-mot-de-passe' })
        .redirects(0)
    }

    const response = await client
      .post('/auth/login')
      .header('X-Forwarded-For', '198.51.100.99, 203.0.113.14')
      .form({ email: advisor.email, password: PASSWORD })
      .redirects(0)

    response.assertStatus(429)
  })

  test('requête Inertia : flash + erreur de formulaire, redirect back au lieu d’un 429 brut', async ({
    assert,
    client,
  }) => {
    const advisor = await withPassword(await createAdvisor())

    for (let i = 0; i < LOGIN_LIMIT; i++) {
      await client
        .post('/auth/login')
        .header('X-Forwarded-For', '203.0.113.15')
        .withInertia()
        .form({ email: advisor.email, password: 'mauvais-mot-de-passe' })
        .redirects(0)
    }

    const response = await client
      .post('/auth/login')
      .header('X-Forwarded-For', '203.0.113.15')
      .header('Referer', '/auth/login')
      .withInertia()
      .form({ email: advisor.email, password: PASSWORD })
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', '/auth/login')
    assert.exists(response.header('retry-after'))
    const message = rateLimitMessage(60)
    response.assertFlashMessage('error', message)
    response.assertFlashMessage('inputErrorsBag', { [RATE_LIMIT_ERROR_KEY]: message })
    assert.isUndefined(response.session(SESSION_KEY))
  })
})

test.group('Rate limiting — POST /auth/register (functional)', (group) => {
  group.each.setup(() => truncateDb())

  test(`la ${REGISTER_LIMIT + 1}ᵉ inscription en une heure renvoie 429 sans créer de compte`, async ({
    assert,
    client,
  }) => {
    for (let i = 0; i < REGISTER_LIMIT; i++) {
      const response = await client
        .post('/auth/register')
        .header('X-Forwarded-For', '203.0.113.20')
        .form({
          email: `conseiller${i}@example.com`,
          password: 'secret123',
          name: `Conseiller ${i}`,
          organizationName: `Cabinet ${i}`,
          role: USERS_ROLES.ADVISOR,
        })
        .redirects(0)
      response.assertStatus(303)
    }

    const response = await client
      .post('/auth/register')
      .header('X-Forwarded-For', '203.0.113.20')
      .form({
        email: 'de.trop@example.com',
        password: 'secret123',
        name: 'De Trop',
        organizationName: 'Cabinet De Trop',
        role: USERS_ROLES.ADVISOR,
      })
      .redirects(0)

    response.assertStatus(429)
    assert.isNull(await User.findBy('email', 'de.trop@example.com'))
  })
})

test.group('Rate limiting — POST /contact-requests (functional)', (group) => {
  group.each.setup(() => truncateDb())

  test(`la ${CONTACT_LIMIT + 1}ᵉ demande en une heure renvoie 429 sans rien enregistrer`, async ({
    assert,
    client,
  }) => {
    for (let i = 0; i < CONTACT_LIMIT; i++) {
      const response = await client
        .post('/contact-requests')
        .header('X-Forwarded-For', '203.0.113.30')
        .header('Accept', 'application/json')
        .json(contactPayload())
        .redirects(0)
      response.assertStatus(302)
    }

    const response = await client
      .post('/contact-requests')
      .header('X-Forwarded-For', '203.0.113.30')
      .header('Accept', 'application/json')
      .json(contactPayload())

    response.assertStatus(429)
    assert.exists(response.header('retry-after'))
    assert.equal(response.body().errors[0].message, rateLimitMessage(3600))
    assert.lengthOf(await ContactRequest.all(), CONTACT_LIMIT)
  })

  test('une autre IP garde son propre quota', async ({ client }) => {
    for (let i = 0; i <= CONTACT_LIMIT; i++) {
      await client
        .post('/contact-requests')
        .header('X-Forwarded-For', '203.0.113.31')
        .header('Accept', 'application/json')
        .json(contactPayload())
    }

    const response = await client
      .post('/contact-requests')
      .header('X-Forwarded-For', '203.0.113.32')
      .header('Accept', 'application/json')
      .json(contactPayload())
      .redirects(0)

    response.assertStatus(302)
  })
})

test.group('Rate limiting — POST /onboarding/:token (functional)', (group) => {
  group.each.setup(() => truncateDb())

  test(`le ${ONBOARDING_LIMIT + 1}ᵉ essai de jeton en une minute renvoie 429`, async ({
    client,
  }) => {
    for (let i = 0; i < ONBOARDING_LIMIT; i++) {
      const response = await client
        .post(`/onboarding/jeton-invente-${i}`)
        .header('X-Forwarded-For', '203.0.113.40')
        .form({ password: 'nouveau-mot-de-passe', password_confirmation: 'nouveau-mot-de-passe' })
        .redirects(0)
      response.assertStatus(302)
    }

    const response = await client
      .post('/onboarding/jeton-invente-final')
      .header('X-Forwarded-For', '203.0.113.40')
      .form({ password: 'nouveau-mot-de-passe', password_confirmation: 'nouveau-mot-de-passe' })
      .redirects(0)

    response.assertStatus(429)
  })
})
