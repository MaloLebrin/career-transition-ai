import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import { USERS_ROLES, type UserRole } from '#shared/types/advisor/roles'
import { SESSION_KEY } from '#tests/functional/auth/helpers'
import { createCandidate, createUser } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/**
 * Onboarding par lien email (start/routes/onboarding.ts) : l'invité ouvre
 * `/onboarding/:token`, choisit son mot de passe, et le lien est consommé.
 */
async function tokenFor(user: User, state: 'valid' | 'expired' | 'used' = 'valid') {
  const token = await OnboardingToken.createForUser(user.id)
  if (state === 'expired') {
    token.expiresAt = DateTime.now().minus({ minutes: 1 })
    await token.save()
  }
  if (state === 'used') {
    token.usedAt = DateTime.now().minus({ hours: 1 })
    await token.save()
  }
  return token
}

const NEW_PASSWORD = 'nouveau-mot-de-passe'

test.group('Onboarding — GET /onboarding/:token (functional)', (group) => {
  group.each.setup(() => truncateDb())

  test('jeton valide : rend SetPassword avec le jeton et le nom de l’utilisateur', async ({
    assert,
    client,
  }) => {
    const { user } = await createCandidate({ onboarded: false })
    const token = await tokenFor(user)

    const response = await client.get(`/onboarding/${token.token}`).withInertia()

    const props = assertPage(assert, response, 'onboarding/SetPassword', ['token', 'userName'])
    assert.equal(props.token, token.token)
    assert.equal(props.userName, user.name)
  })

  test('jeton inconnu : rend InvalidToken sans indicateur d’expiration', async ({
    assert,
    client,
  }) => {
    const response = await client.get('/onboarding/jeton-inexistant').withInertia()

    const props = assertPage(assert, response, 'onboarding/InvalidToken')
    assert.notProperty(props, 'expired')
  })

  test('jeton expiré : rend InvalidToken avec expired = true', async ({ assert, client }) => {
    const { user } = await createCandidate({ onboarded: false })
    const token = await tokenFor(user, 'expired')

    const response = await client.get(`/onboarding/${token.token}`).withInertia()

    const props = assertPage(assert, response, 'onboarding/InvalidToken', ['expired'])
    assert.isTrue(props.expired)
  })

  test('jeton déjà utilisé : rend InvalidToken avec expired = false', async ({
    assert,
    client,
  }) => {
    const { user } = await createCandidate({ onboarded: false })
    const token = await tokenFor(user, 'used')

    const response = await client.get(`/onboarding/${token.token}`).withInertia()

    const props = assertPage(assert, response, 'onboarding/InvalidToken', ['expired'])
    assert.isFalse(props.expired)
  })

  test('le jeton ne fuit pas vers un autre utilisateur : SetPassword affiche le bon nom', async ({
    assert,
    client,
  }) => {
    const { user: first } = await createCandidate({ onboarded: false })
    const { user: second } = await createCandidate({ onboarded: false })
    await tokenFor(first)
    const secondToken = await tokenFor(second)

    const response = await client.get(`/onboarding/${secondToken.token}`).withInertia()

    const props = assertPage(assert, response, 'onboarding/SetPassword', ['userName'])
    assert.equal(props.userName, second.name)
  })
})

test.group('Onboarding — POST /onboarding/:token (functional)', (group) => {
  group.each.setup(() => truncateDb())

  test('jeton inconnu : redirige vers /auth/login avec un flash d’erreur', async ({
    assert,
    client,
  }) => {
    const response = await client
      .post('/onboarding/jeton-inexistant')
      .form({ password: NEW_PASSWORD, password_confirmation: NEW_PASSWORD })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
    response.assertFlashMessage('error', 'Lien invalide ou expiré.')
    assert.isUndefined(response.session(SESSION_KEY))
  })

  test('jeton expiré : redirige vers /auth/login sans toucher au compte', async ({
    assert,
    client,
  }) => {
    const { user } = await createCandidate({ onboarded: false })
    const token = await tokenFor(user, 'expired')
    const passwordBefore = user.password

    const response = await client
      .post(`/onboarding/${token.token}`)
      .form({ password: NEW_PASSWORD, password_confirmation: NEW_PASSWORD })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
    response.assertFlashMessage('error', 'Ce lien a déjà été utilisé ou a expiré.')
    assert.isUndefined(response.session(SESSION_KEY))

    await user.refresh()
    assert.equal(user.password, passwordBefore)
  })

  test('jeton déjà utilisé : refuse de le rejouer', async ({ assert, client }) => {
    const { user } = await createCandidate({ onboarded: false })
    const token = await tokenFor(user, 'used')

    const response = await client
      .post(`/onboarding/${token.token}`)
      .form({ password: NEW_PASSWORD, password_confirmation: NEW_PASSWORD })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
    response.assertFlashMessage('error', 'Ce lien a déjà été utilisé ou a expiré.')
    assert.isUndefined(response.session(SESSION_KEY))
  })

  test('confirmation différente : erreur sur password_confirmation, jeton non consommé', async ({
    assert,
    client,
  }) => {
    const { user } = await createCandidate({ onboarded: false })
    const token = await tokenFor(user)

    const response = await client
      .post(`/onboarding/${token.token}`)
      .withInertia()
      .form({ password: NEW_PASSWORD, password_confirmation: 'autre-chose-123' })
      .redirects(0)

    assertFieldErrors(assert, response, ['password_confirmation'])
    await token.refresh()
    assert.isNull(token.usedAt)
    assert.isUndefined(response.session(SESSION_KEY))
  })

  test('mot de passe trop court (< 8) : erreur sur password', async ({ assert, client }) => {
    const { user } = await createCandidate({ onboarded: false })
    const token = await tokenFor(user)

    const response = await client
      .post(`/onboarding/${token.token}`)
      .withInertia()
      .form({ password: 'court', password_confirmation: 'court' })
      .redirects(0)

    assertFieldErrors(assert, response, ['password'])
    await token.refresh()
    assert.isNull(token.usedAt)
  })

  test('candidat : consomme le jeton, marque l’onboarding, ouvre la session et redirige vers /dashboard/candidat', async ({
    assert,
    client,
  }) => {
    const { user } = await createCandidate({ onboarded: false })
    user.onboardingCompletedAt = null
    await user.save()
    const token = await tokenFor(user)

    const response = await client
      .post(`/onboarding/${token.token}`)
      .form({ password: NEW_PASSWORD, password_confirmation: NEW_PASSWORD })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/candidat')
    response.assertFlashMessage('success', 'Mot de passe créé. Bienvenue !')
    assert.equal(response.session(SESSION_KEY), user.id)

    await token.refresh()
    assert.isNotNull(token.usedAt)

    await user.refresh()
    assert.isNotNull(user.onboardingCompletedAt)
  })

  test('le jeton consommé ne peut plus servir : un second POST est refusé', async ({
    assert,
    client,
  }) => {
    const { user } = await createCandidate({ onboarded: false })
    const token = await tokenFor(user)

    await client
      .post(`/onboarding/${token.token}`)
      .form({ password: NEW_PASSWORD, password_confirmation: NEW_PASSWORD })
      .redirects(0)

    const replay = await client
      .post(`/onboarding/${token.token}`)
      .form({ password: 'encore-un-autre', password_confirmation: 'encore-un-autre' })
      .redirects(0)

    replay.assertStatus(302)
    replay.assertHeader('location', '/auth/login')
    replay.assertFlashMessage('error', 'Ce lien a déjà été utilisé ou a expiré.')
    assert.isUndefined(replay.session(SESSION_KEY))

    const page = await client.get(`/onboarding/${token.token}`).withInertia()
    assertPage(assert, page, 'onboarding/InvalidToken', ['expired'])
  })

  const redirectsByRole: Array<[UserRole, string]> = [
    [USERS_ROLES.ADVISOR, '/dashboard/conseiller'],
    [USERS_ROLES.ADMIN, '/dashboard/conseiller'],
    [USERS_ROLES.EXPERT, '/dashboard/conseiller'],
    [USERS_ROLES.SUPER_ADMIN, '/dashboard/super-admin'],
  ]

  for (const [role, target] of redirectsByRole) {
    test(`rôle ${role} : redirige vers ${target} après création du mot de passe`, async ({
      assert,
      client,
    }) => {
      const user = await createUser(role)
      const token = await tokenFor(user)

      const response = await client
        .post(`/onboarding/${token.token}`)
        .form({ password: NEW_PASSWORD, password_confirmation: NEW_PASSWORD })
        .redirects(0)

      response.assertStatus(302)
      response.assertHeader('location', target)
      assert.equal(response.session(SESSION_KEY), user.id)
    })
  }
})
