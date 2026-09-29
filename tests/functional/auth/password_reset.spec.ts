import { FORGOT_PASSWORD_SENT_MESSAGE } from '#controllers/passwords_controller'
import { PasswordResetTokenFactory } from '#database/factories/password_reset_token_factory'
import PasswordResetToken from '#models/password_reset_token'
import User from '#models/user'
import env from '#start/env'
import { PASSWORD, SESSION_KEY, withPassword } from '#tests/functional/auth/helpers'
import {
  fakeMail,
  type RecordingMailProvider,
  restoreMail,
} from '#tests/functional/conseiller/helpers'
import { createAdvisor, createCandidate } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors, inertiaErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import hash from '@adonisjs/core/services/hash'
import { test } from '@japa/runner'

/**
 * #68 — « mot de passe oublié » en libre-service, changement de mot de passe
 * une fois connecté, et lien envoyé par le super admin à la place d'un mot de
 * passe temporaire affiché à l'écran.
 */
const NEW_PASSWORD = 'nouveau-mot-de-passe'

async function passwordOf(user: User, candidate: string) {
  const reloaded = await User.findOrFail(user.id)
  return hash.verify(reloaded.password, candidate)
}

test.group('Mot de passe oublié — GET/POST /auth/forgot-password (functional)', (group) => {
  let mails: RecordingMailProvider

  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    mails = fakeMail()
    return () => restoreMail()
  })

  test('rend la page auth/ForgotPassword', async ({ assert, client }) => {
    const response = await client.get('/auth/forgot-password').withInertia()

    assertPage(assert, response, 'auth/ForgotPassword')
  })

  test('compte connu : envoie un lien bâti sur APP_URL, jamais l’en-tête Host', async ({
    assert,
    client,
  }) => {
    const advisor = await createAdvisor()

    const response = await client
      .post('/auth/forgot-password')
      .withInertia()
      .header('X-Forwarded-Host', 'evil.test')
      .form({ email: advisor.email })
      .redirects(0)

    response.assertStatus(302)
    response.assertFlashMessage('success', FORGOT_PASSWORD_SENT_MESSAGE)
    assert.deepEqual(mails.recipients(), [advisor.email])
    const secret = mails.passwordResetSecret()
    const base = env.get('APP_URL').replace(/\/+$/, '')
    assert.include(mails.sent[0].text!, `${base}/auth/password-reset/${secret}`)
    assert.notInclude(mails.sent[0].text!, 'evil.test')
    // Seule l'empreinte est en base.
    const row = await PasswordResetToken.findByOrFail('userId', advisor.id)
    assert.equal(row.token, PasswordResetToken.hash(secret))
  })

  test('compte inconnu : même réponse, aucun e-mail (pas d’énumération)', async ({
    assert,
    client,
  }) => {
    const response = await client
      .post('/auth/forgot-password')
      .withInertia()
      .form({ email: 'personne@example.com' })
      .redirects(0)

    response.assertStatus(302)
    response.assertFlashMessage('success', FORGOT_PASSWORD_SENT_MESSAGE)
    assert.lengthOf(mails.sent, 0)
  })

  test('e-mail invalide : erreur sur email', async ({ assert, client }) => {
    const response = await client
      .post('/auth/forgot-password')
      .withInertia()
      .form({ email: 'pas-un-email' })
      .redirects(0)

    assertFieldErrors(assert, response, ['email'])
    assert.lengthOf(mails.sent, 0)
  })

  test('utilisateur connecté : redirigé vers /dashboard (route invités)', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client.get('/auth/forgot-password').loginAs(advisor).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard')
  })
})

test.group('Réinitialisation — GET/POST /auth/password-reset/:token (functional)', (group) => {
  let mails: RecordingMailProvider

  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    mails = fakeMail()
    return () => restoreMail()
  })

  test('lien valide : rend le formulaire avec le secret', async ({ assert, client }) => {
    const advisor = await createAdvisor()
    const token = await PasswordResetToken.createForUser(advisor.id)

    const response = await client.get(`/auth/password-reset/${token.plainToken}`).withInertia()

    const props = assertPage(assert, response, 'auth/ResetPassword', ['token', 'expired'])
    assert.equal(props.token, token.plainToken)
    assert.isFalse(props.expired)
  })

  test('lien expiré, utilisé, inconnu ou empreinte : aucun formulaire', async ({
    assert,
    client,
  }) => {
    const advisor = await createAdvisor()
    const expired = await PasswordResetTokenFactory.merge({ userId: advisor.id })
      .apply('expired')
      .create()
    const used = await PasswordResetTokenFactory.merge({ userId: advisor.id })
      .apply('used')
      .create()

    const cases: Array<[string, boolean]> = [
      [expired.plainToken!, true],
      [used.plainToken!, false],
      ['inconnu', false],
      [expired.token, false],
    ]
    for (const [secret, isExpired] of cases) {
      const response = await client.get(`/auth/password-reset/${secret}`).withInertia()
      const props = assertPage(assert, response, 'auth/ResetPassword', ['token', 'expired'])
      assert.isNull(props.token)
      assert.equal(props.expired, isExpired)
    }
  })

  test('parcours complet : nouveau mot de passe, lien consommé, confirmation, connexion', async ({
    assert,
    client,
  }) => {
    const advisor = await withPassword(await createAdvisor())
    await client.post('/auth/forgot-password').withInertia().form({ email: advisor.email })
    const secret = mails.passwordResetSecret()

    const response = await client
      .post(`/auth/password-reset/${secret}`)
      .withInertia()
      .form({ password: NEW_PASSWORD, password_confirmation: NEW_PASSWORD })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
    response.assertFlashMessage('success', 'Mot de passe modifié. Vous pouvez vous connecter.')
    // Pas de connexion automatique : l'utilisateur se reconnecte.
    assert.isUndefined(response.session(SESSION_KEY))
    assert.isTrue(await passwordOf(advisor, NEW_PASSWORD))
    assert.isFalse(await passwordOf(advisor, PASSWORD))
    assert.deepEqual(mails.recipients(), [advisor.email, advisor.email])
    assert.equal(mails.sent[1].subject, 'Votre mot de passe a été modifié')

    const login = await client
      .post('/auth/login')
      .form({ email: advisor.email, password: NEW_PASSWORD })
      .redirects(0)
    assert.equal(login.session(SESSION_KEY), advisor.id)

    // Le lien ne sert qu'une fois.
    const replay = await client
      .post(`/auth/password-reset/${secret}`)
      .withInertia()
      .form({ password: 'encore-un-autre', password_confirmation: 'encore-un-autre' })
      .redirects(0)
    replay.assertStatus(302)
    assert.match(replay.flashMessage('error') as string, /invalide ou a expiré/)
    assert.isTrue(await passwordOf(advisor, NEW_PASSWORD))
  })

  test('lien expiré : refusé, mot de passe inchangé', async ({ assert, client }) => {
    const advisor = await withPassword(await createAdvisor())
    const token = await PasswordResetTokenFactory.merge({ userId: advisor.id })
      .apply('expired')
      .create()

    const response = await client
      .post(`/auth/password-reset/${token.plainToken}`)
      .withInertia()
      .form({ password: NEW_PASSWORD, password_confirmation: NEW_PASSWORD })
      .redirects(0)

    response.assertStatus(302)
    assert.match(response.flashMessage('error') as string, /invalide ou a expiré/)
    assert.isTrue(await passwordOf(advisor, PASSWORD))
  })

  test('confirmation différente : erreur de champ, lien non consommé', async ({
    assert,
    client,
  }) => {
    const advisor = await createAdvisor()
    const token = await PasswordResetToken.createForUser(advisor.id)

    const response = await client
      .post(`/auth/password-reset/${token.plainToken}`)
      .withInertia()
      .form({ password: NEW_PASSWORD, password_confirmation: 'autre-chose-123' })
      .redirects(0)

    assertFieldErrors(assert, response, ['password_confirmation'])
    await token.refresh()
    assert.isTrue(token.isValid())
  })
})

test.group('Changement de mot de passe — PUT /dashboard/password (functional)', (group) => {
  let mails: RecordingMailProvider

  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    mails = fakeMail()
    return () => restoreMail()
  })

  test('sans session : 401', async ({ client }) => {
    const response = await client
      .put('/dashboard/password')
      .header('Accept', 'application/json')
      .json({
        current_password: PASSWORD,
        password: NEW_PASSWORD,
        password_confirmation: NEW_PASSWORD,
      })
      .redirects(0)

    response.assertStatus(401)
  })

  test('conseiller et candidat changent leur mot de passe, avec e-mail de confirmation', async ({
    assert,
    client,
  }) => {
    const advisor = await withPassword(await createAdvisor())
    const { user: candidate } = await createCandidate()
    await withPassword(candidate)

    for (const user of [advisor, candidate]) {
      const response = await client
        .put('/dashboard/password')
        .loginAs(user)
        .withInertia()
        .form({
          current_password: PASSWORD,
          password: NEW_PASSWORD,
          password_confirmation: NEW_PASSWORD,
        })
        .redirects(0)

      // PUT Inertia : redirect back en 303.
      response.assertStatus(303)
      response.assertFlashMessage('success', 'Mot de passe modifié.')
      assert.isTrue(await passwordOf(user, NEW_PASSWORD))
    }
    assert.deepEqual(mails.recipients(), [advisor.email, candidate.email])
  })

  test('mot de passe actuel faux : flash d’erreur, rien ne change', async ({ assert, client }) => {
    const advisor = await withPassword(await createAdvisor())

    const response = await client
      .put('/dashboard/password')
      .loginAs(advisor)
      .withInertia()
      .form({
        current_password: 'faux',
        password: NEW_PASSWORD,
        password_confirmation: NEW_PASSWORD,
      })
      .redirects(0)

    response.assertStatus(303)
    response.assertFlashMessage('error', 'Le mot de passe actuel est incorrect.')
    assert.isTrue(await passwordOf(advisor, PASSWORD))
    assert.lengthOf(mails.sent, 0)
  })

  test('nouveau mot de passe identique à l’actuel ou trop court : erreur sur password', async ({
    assert,
    client,
  }) => {
    const advisor = await withPassword(await createAdvisor())

    for (const password of [PASSWORD, 'court']) {
      const response = await client
        .put('/dashboard/password')
        .loginAs(advisor)
        .withInertia()
        .form({ current_password: PASSWORD, password, password_confirmation: password })
        .redirects(0)

      response.assertStatus(303)
      assert.deepEqual(Object.keys(inertiaErrors(response)), ['password'])
    }
    assert.isTrue(await passwordOf(advisor, PASSWORD))
  })
})
