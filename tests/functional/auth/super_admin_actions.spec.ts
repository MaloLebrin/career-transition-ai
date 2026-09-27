import User from '#models/user'
import { PASSWORD, SESSION_KEY, withPassword } from '#tests/functional/auth/helpers'
import { createAdmin, createAdvisor, createSuperAdmin } from '#tests/support/actors'
import { truncateDb } from '#tests/utils/db'
import hash from '@adonisjs/core/services/hash'
import { test } from '@japa/runner'

/**
 * Actions super admin exposées sous /auth (start/routes/auth.ts) :
 * impersonation et réinitialisation de mot de passe, derrière
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
    assert.equal(
      response.flashMessage('success'),
      `Vous êtes maintenant connecté en tant que ${target.name}.`
    )
  })

  test('un super admin connecté réinitialise le mot de passe de l’utilisateur cible', async ({
    assert,
    client,
  }) => {
    const superAdmin = await createSuperAdmin()
    const target = await withPassword(await createAdvisor())

    const response = await client
      .post(`/auth/reset-password/${target.id}`)
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/super-admin')
    // La session reste celle du super admin.
    assert.equal(response.session(SESSION_KEY), superAdmin.id)

    const flash = response.flashMessage('success') as string
    const match = flash.match(/Nouveau mot de passe temporaire: (\S+)$/)
    assert.isNotNull(match, flash)
    assert.include(flash, `Mot de passe réinitialisé pour ${target.name}.`)

    const reloaded = await User.findOrFail(target.id)
    assert.isFalse(await hash.verify(reloaded.password, PASSWORD))
    assert.isTrue(await hash.verify(reloaded.password, match![1]))
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
