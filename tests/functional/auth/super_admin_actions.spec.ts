import User from '#models/user'
import { IMPERSONATOR_SESSION_KEY } from '#services/impersonation_service'
import { PASSWORD, SESSION_KEY, withPassword } from '#tests/functional/auth/helpers'
import { fakeMail, restoreMail } from '#tests/functional/conseiller/helpers'
import {
  createAdmin,
  createAdvisor,
  createCandidate,
  createSuperAdmin,
} from '#tests/support/actors'
import { truncateDb } from '#tests/utils/db'
import hash from '@adonisjs/core/services/hash'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/**
 * Actions super admin exposées sous /auth (start/routes/auth.ts) :
 * impersonation et envoi d'un lien de réinitialisation de mot de passe, derrière
 * `middleware.auth()` + `middleware.superAdmin()`.
 *
 * Régression : ces routes étaient déclarées sans `auth()`, `ctx.auth.user` n'y
 * était jamais renseigné et le contrôleur répondait 401 même à un super admin
 * connecté.
 */
test.group('Auth — actions super admin (functional)', (group) => {
  group.each.setup(() => truncateDb())

  test('POST /auth/impersonate/:id sans session renvoie 401 et n’ouvre aucune session', async ({
    assert,
    client,
  }) => {
    const target = await createAdvisor()

    const response = await client
      .post(`/auth/impersonate/${target.id}`)
      .header('Accept', 'application/json')
      .redirects(0)

    response.assertStatus(401)
    assert.isUndefined(response.session(SESSION_KEY))
  })

  test('POST /auth/reset-password/:id sans session renvoie 401 et ne touche pas au mot de passe', async ({
    assert,
    client,
  }) => {
    const target = await withPassword(await createAdvisor())

    const response = await client
      .post(`/auth/reset-password/${target.id}`)
      .header('Accept', 'application/json')
      .redirects(0)

    response.assertStatus(401)
    const reloaded = await User.findOrFail(target.id)
    assert.isTrue(await hash.verify(reloaded.password, PASSWORD))
  })

  test('un super admin connecté se fait passer pour l’utilisateur cible', async ({
    assert,
    client,
  }) => {
    const superAdmin = await createSuperAdmin()
    const target = await createAdvisor()

    const response = await client
      .post(`/auth/impersonate/${target.id}`)
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard')
    assert.equal(response.session(SESSION_KEY), target.id)
    // #143 : l'id du super admin survit à la régénération de session du login.
    assert.equal(response.session(IMPERSONATOR_SESSION_KEY), superAdmin.id)
    assert.equal(
      response.flashMessage('success'),
      `Vous êtes maintenant connecté en tant que ${target.name}.`
    )
  })

  test('prise d’identité d’un autre super admin ou d’un compte désactivé : refusée (#143)', async ({
    assert,
    client,
  }) => {
    const superAdmin = await createSuperAdmin()
    const other = await createSuperAdmin()
    const disabled = await createAdvisor()
    disabled.disabledAt = DateTime.now()
    await disabled.save()

    for (const target of [other, disabled]) {
      const response = await client
        .post(`/auth/impersonate/${target.id}`)
        .loginAs(superAdmin)
        .withInertia()
        .header('Referer', '/dashboard/super-admin/organizations')
        .redirects(0)

      response.assertStatus(302)
      response.assertHeader('location', '/dashboard/super-admin/organizations')
      response.assertFlashMessage('error', 'Impossible de prendre l’identité de ce compte.')
      assert.equal(response.session(SESSION_KEY), superAdmin.id)
      assert.isUndefined(response.session(IMPERSONATOR_SESSION_KEY))
    }
  })

  /**
   * #68 : le super admin n'obtient plus de mot de passe temporaire à l'écran.
   * Le titulaire reçoit un lien de réinitialisation, son mot de passe ne change pas.
   */
  test('un super admin connecté envoie un lien de réinitialisation à l’utilisateur cible', async ({
    assert,
    client,
  }) => {
    const mails = fakeMail()
    try {
      const superAdmin = await createSuperAdmin()
      const target = await withPassword(await createAdvisor())

      const response = await client
        .post(`/auth/reset-password/${target.id}`)
        .loginAs(superAdmin)
        .withInertia()
        .header('Referer', '/dashboard/super-admin/organizations')
        .redirects(0)

      response.assertStatus(302)
      response.assertHeader('location', '/dashboard/super-admin/organizations')
      // La session reste celle du super admin.
      assert.equal(response.session(SESSION_KEY), superAdmin.id)
      response.assertFlashMessage('success', `Lien de réinitialisation envoyé à ${target.name}.`)

      assert.deepEqual(mails.recipients(), [target.email])
      assert.match(mails.passwordResetSecret(), /^[0-9a-f]{64}$/)
      const reloaded = await User.findOrFail(target.id)
      assert.isTrue(await hash.verify(reloaded.password, PASSWORD))
    } finally {
      restoreMail()
    }
  })

  test('utilisateur cible inconnu : flash d’erreur, aucun e-mail', async ({ client, assert }) => {
    const mails = fakeMail()
    try {
      const superAdmin = await createSuperAdmin()

      const response = await client
        .post('/auth/reset-password/999999')
        .loginAs(superAdmin)
        .withInertia()
        .redirects(0)

      response.assertStatus(302)
      response.assertFlashMessage('error', 'Utilisateur introuvable.')
      assert.lengthOf(mails.sent, 0)
    } finally {
      restoreMail()
    }
  })

  test('un utilisateur connecté non super admin reçoit 403 sur les deux routes', async ({
    assert,
    client,
  }) => {
    const admin = await createAdmin()
    const target = await withPassword(await createAdvisor())

    const impersonate = await client
      .post(`/auth/impersonate/${target.id}`)
      .header('Accept', 'application/json')
      .loginAs(admin)
      .redirects(0)
    impersonate.assertStatus(403)
    assert.equal(impersonate.session(SESSION_KEY), admin.id)

    const reset = await client
      .post(`/auth/reset-password/${target.id}`)
      .header('Accept', 'application/json')
      .loginAs(admin)
      .redirects(0)
    reset.assertStatus(403)
    const reloaded = await User.findOrFail(target.id)
    assert.isTrue(await hash.verify(reloaded.password, PASSWORD))
  })
})

/**
 * Retour au compte super admin après une prise d'identité (#143) :
 * `POST /auth/impersonation/leave`, bandeau alimenté par la prop `impersonation`.
 */
test.group('Auth — retour de prise d’identité (functional)', (group) => {
  group.each.setup(() => truncateDb())

  test('le bandeau est partagé pendant la prise d’identité, absent sinon', async ({ client }) => {
    const superAdmin = await createSuperAdmin()
    const { user: candidate } = await createCandidate()

    const impersonating = await client
      .get('/dashboard/candidat')
      .loginAs(candidate)
      .withSession({ [IMPERSONATOR_SESSION_KEY]: superAdmin.id })
      .withInertia()
    impersonating.assertStatus(200)
    impersonating.assertInertiaPropsContains({
      impersonation: { impersonatorName: superAdmin.name },
    })

    const normal = await client.get('/dashboard/candidat').loginAs(candidate).withInertia()
    normal.assertStatus(200)
    normal.assertInertiaPropsContains({ user: { id: candidate.id } })
  })

  test('« Revenir à mon compte » rouvre la session du super admin sans mot de passe', async ({
    assert,
    client,
  }) => {
    const superAdmin = await createSuperAdmin()
    const target = await createAdvisor()

    const response = await client
      .post('/auth/impersonation/leave')
      .loginAs(target)
      .withSession({ [IMPERSONATOR_SESSION_KEY]: superAdmin.id })
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/super-admin')
    assert.equal(response.session(SESSION_KEY), superAdmin.id)
    assert.isUndefined(response.session(IMPERSONATOR_SESSION_KEY))
    response.assertFlashMessage('success', 'Vous êtes de retour sur votre compte.')
  })

  test('sans prise d’identité en cours : refus, la session ne change pas', async ({
    assert,
    client,
  }) => {
    const advisor = await createAdvisor()

    const response = await client
      .post('/auth/impersonation/leave')
      .loginAs(advisor)
      .withInertia()
      .header('Referer', '/dashboard/conseiller')
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/conseiller')
    response.assertFlashMessage('error', 'Aucune prise d’identité en cours.')
    assert.equal(response.session(SESSION_KEY), advisor.id)
  })

  test('compte d’origine désactivé entre-temps : déconnexion', async ({ assert, client }) => {
    const superAdmin = await createSuperAdmin()
    superAdmin.disabledAt = DateTime.now()
    await superAdmin.save()
    const target = await createAdvisor()

    const response = await client
      .post('/auth/impersonation/leave')
      .loginAs(target)
      .withSession({ [IMPERSONATOR_SESSION_KEY]: superAdmin.id })
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
    assert.isUndefined(response.session(SESSION_KEY))
    assert.isUndefined(response.session(IMPERSONATOR_SESSION_KEY))
  })

  test('sans session : 401', async ({ client }) => {
    const response = await client
      .post('/auth/impersonation/leave')
      .header('Accept', 'application/json')
      .redirects(0)

    response.assertStatus(401)
  })

  test('la déconnexion clôt aussi la prise d’identité', async ({ assert, client }) => {
    const superAdmin = await createSuperAdmin()
    const target = await createAdvisor()

    const response = await client
      .post('/auth/logout')
      .loginAs(target)
      .withSession({ [IMPERSONATOR_SESSION_KEY]: superAdmin.id })
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    assert.isUndefined(response.session(IMPERSONATOR_SESSION_KEY))
  })
})
