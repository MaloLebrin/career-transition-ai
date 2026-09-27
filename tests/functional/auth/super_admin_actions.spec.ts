import User from '#models/user'
import { PASSWORD, SESSION_KEY, withPassword } from '#tests/functional/auth/helpers'
import { createAdvisor } from '#tests/support/actors'
import { truncateDb } from '#tests/utils/db'
import hash from '@adonisjs/core/services/hash'
import { test } from '@japa/runner'

/**
 * Actions super admin exposées sous /auth (start/routes/auth.ts) :
 * impersonation et réinitialisation de mot de passe.
 *
 * Seul le refus anonyme est couvert ici : ces routes n'ont pas de middleware
 * `auth()`, `ctx.auth.user` n'y est donc jamais renseigné et le contrôleur
 * répond 401 même à un super admin connecté (anomalie remontée hors tests).
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
})
