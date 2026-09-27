import { SESSION_KEY } from '#tests/functional/auth/helpers'
import { createAdvisor } from '#tests/support/actors'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Déconnexion : `POST /auth/logout` (start/routes/auth.ts).
 */
test.group('Auth — déconnexion (functional)', (group) => {
  group.each.setup(() => truncateDb())

  test('POST /auth/logout ferme la session et redirige vers /', async ({ assert, client }) => {
    const advisor = await createAdvisor()

    const response = await client.post('/auth/logout').loginAs(advisor).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/')
    assert.isUndefined(response.session(SESSION_KEY))
  })

  test('POST /auth/logout sans session redirige aussi vers /', async ({ assert, client }) => {
    const response = await client.post('/auth/logout').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/')
    assert.isUndefined(response.session(SESSION_KEY))
  })
})
