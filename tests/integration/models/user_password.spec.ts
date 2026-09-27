import { test } from '@japa/runner'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'
import { createAdvisor } from '#tests/support/actors'

/**
 * Hachage du mot de passe (`withAuthFinder`).
 *
 * Le hook `beforeSave` du mixin hashe **toute** valeur modifiée, sans regarder
 * si elle l'est déjà. Tout appelant doit donc affecter le mot de passe en clair ;
 * un `hash.make()` en amont rendait le compte inaccessible (onboarding, factory,
 * comptes temporaires des invitations).
 */
test.group('User — hachage du mot de passe', () => {
  test('un mot de passe en clair est hashé une seule fois', async ({ assert }) => {
    const user = await createAdvisor()
    user.password = 'mot-de-passe-1'
    await user.save()

    const stored = await User.findOrFail(user.id)
    assert.notEqual(stored.password, 'mot-de-passe-1')
    assert.isTrue(await hash.verify(stored.password, 'mot-de-passe-1'))
  })

  test('UserFactory : le mot de passe « password » est vérifiable', async ({ assert }) => {
    const user = await createAdvisor()

    const stored = await User.findOrFail(user.id)
    assert.isTrue(await hash.verify(stored.password, 'password'))
  })

  test('User.verifyCredentials accepte le mot de passe de la factory', async ({ assert }) => {
    const user = await createAdvisor()

    const verified = await User.verifyCredentials(user.email, 'password')
    assert.equal(verified.id, user.id)
  })
})
