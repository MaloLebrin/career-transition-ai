import { USERS_ROLES } from '#shared/types/advisor/roles'
import { createAdvisor, createUser } from '#tests/support/actors'
import { PASSWORD, SESSION_KEY, withPassword } from '#tests/functional/auth/helpers'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Connexion : page `Login` (routes publiques, `guest()`) et `POST /auth/login`
 * (start/routes/auth.ts).
 *
 * Les acteurs reçoivent un mot de passe **en clair** via `withPassword()` : le
 * hash pré-calculé de `UserFactory` est re-hashé par le hook `beforeSave` du
 * mixin `withAuthFinder`, et ne permet donc pas de se connecter.
 */

test.group('Auth — connexion (functional)', (group) => {
  group.each.setup(() => truncateDb())

  test('GET /auth redirige vers /auth/login', async ({ client }) => {
    const response = await client.get('/auth').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
  })

  test('GET /auth/login rend la page Login pour un invité', async ({ assert, client }) => {
    const response = await client.get('/auth/login').withInertia()

    const props = assertPage(assert, response, 'Login', ['errors', 'flash'])
    // `user` partagé en `always(undefined)` : la clé disparaît du JSON pour un invité
    assert.notProperty(props, 'user')
  })

  test('GET /auth/login redirige un utilisateur connecté vers /dashboard', async ({ client }) => {
    const advisor = await withPassword(await createAdvisor())

    const response = await client.get('/auth/login').loginAs(advisor).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard')
  })

  test('POST /auth/login avec des identifiants valides ouvre la session et redirige (303) vers /dashboard', async ({
    assert,
    client,
  }) => {
    const advisor = await withPassword(await createAdvisor())

    const response = await client
      .post('/auth/login')
      .withInertia()
      .form({ email: advisor.email, password: PASSWORD })
      .redirects(0)
    response.assertStatus(303)
    response.assertHeader('location', '/dashboard')
    assert.equal(response.session(SESSION_KEY), advisor.id)
  })

  test('POST /auth/login accepte un email entouré d’espaces (trim du validateur)', async ({
    assert,
    client,
  }) => {
    const advisor = await withPassword(await createAdvisor())

    const response = await client
      .post('/auth/login')
      .withInertia()
      .form({ email: `  ${advisor.email}  `, password: PASSWORD })
      .redirects(0)

    response.assertStatus(303)
    assert.equal(response.session(SESSION_KEY), advisor.id)
  })

  test('POST /auth/login (JSON) avec un mauvais mot de passe renvoie 401 sans ouvrir de session', async ({
    assert,
    client,
  }) => {
    const advisor = await withPassword(await createAdvisor())

    const response = await client
      .post('/auth/login')
      .header('Accept', 'application/json')
      .json({ email: advisor.email, password: 'wrong-password' })
      .redirects(0)

    response.assertStatus(401)
    response.assertBody({ message: 'Identifiants invalides' })
    assert.isUndefined(response.session(SESSION_KEY))
  })

  test('POST /auth/login (JSON) avec un email inconnu renvoie 401 — même message que le mauvais mot de passe', async ({
    client,
  }) => {
    const response = await client
      .post('/auth/login')
      .header('Accept', 'application/json')
      .json({ email: 'inconnu@example.com', password: PASSWORD })
      .redirects(0)

    response.assertStatus(401)
    response.assertBody({ message: 'Identifiants invalides' })
  })

  test('POST /auth/login (Inertia) avec un mauvais mot de passe : flash erreur + retour arrière', async ({
    assert,
    client,
  }) => {
    const advisor = await withPassword(await createAdvisor())

    const response = await client
      .post('/auth/login')
      .withInertia()
      .header('Referer', '/auth/login')
      .form({ email: advisor.email, password: 'wrong-password' })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
    response.assertFlashMessage('error', 'Identifiants invalides')
    assert.isUndefined(response.session(SESSION_KEY))
  })

  test('POST /auth/login rejette un payload invalide sur email et password', async ({
    assert,
    client,
  }) => {
    const response = await client
      .post('/auth/login')
      .withInertia()
      .form({ email: 'pas-un-email', password: '123' })
      .redirects(0)

    assertFieldErrors(assert, response, ['email', 'password'])
    assert.isUndefined(response.session(SESSION_KEY))
  })

  test('POST /auth/login exige les deux champs', async ({ assert, client }) => {
    const response = await client.post('/auth/login').withInertia().form({}).redirects(0)

    assertFieldErrors(assert, response, ['email', 'password'])
  })

  test('POST /auth/login redirige vers /dashboard quel que soit le rôle (candidat)', async ({
    assert,
    client,
  }) => {
    const candidate = await withPassword(await createUser(USERS_ROLES.EMPLOYEE))

    const response = await client
      .post('/auth/login')
      .withInertia()
      .form({ email: candidate.email, password: PASSWORD })
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', '/dashboard')
    assert.equal(response.session(SESSION_KEY), candidate.id)
  })
})
