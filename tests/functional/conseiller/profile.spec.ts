import User from '#models/user'
import { createAdvisor } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { inertiaErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Profil du conseiller connecté : GET/PUT /dashboard/conseiller/profile
 */
const PROFILE = '/dashboard/conseiller/profile'

test.group('Conseiller — profil', (group) => {
  group.each.setup(() => truncateDb())

  test('rend la page profil', async ({ client, assert }) => {
    const advisor = await createAdvisor()

    const response = await client.get(PROFILE).loginAs(advisor).withInertia()

    assertPage(assert, response, 'dashboard/conseiller/profile/Home')
  })

  test('met à jour le nom et l’email puis redirige vers les paramètres', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()

    const response = await client
      .put(PROFILE)
      .json({ name: 'Claire Conseil', email: 'claire@example.com' })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', '/dashboard/conseiller/settings')
    assert.equal(response.flashMessage('success'), 'Profil mis à jour.')

    await advisor.refresh()
    assert.equal(advisor.name, 'Claire Conseil')
    assert.equal(advisor.email, 'claire@example.com')
  })

  test('refuse un email déjà utilisé (flash error, rien ne change)', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const other = await createAdvisor()
    const originalEmail = advisor.email

    const response = await client
      .put(PROFILE)
      .header('referer', PROFILE)
      .json({ name: 'X', email: other.email })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', PROFILE)
    assert.equal(response.flashMessage('error'), 'Cet email est déjà utilisé.')
    const reloaded = await User.findOrFail(advisor.id)
    assert.equal(reloaded.email, originalEmail)
  })

  test('rejette un nom vide et un email invalide', async ({ client, assert }) => {
    const advisor = await createAdvisor()

    const response = await client
      .put(PROFILE)
      .json({ name: '', email: 'pas-un-email' })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    assert.sameMembers(Object.keys(inertiaErrors(response)), ['name', 'email'])
  })
})
