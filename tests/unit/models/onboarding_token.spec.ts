import OnboardingToken from '#models/onboarding_token'
import { createCandidate } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { createHash } from 'node:crypto'

test.group('OnboardingToken', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('hash : SHA-256 hexadécimal du secret', ({ assert }) => {
    assert.equal(OnboardingToken.hash('abc'), createHash('sha256').update('abc').digest('hex'))
    assert.match(OnboardingToken.hash('abc'), /^[0-9a-f]{64}$/)
  })

  /** Régression #65 : le secret du lien était stocké en clair. */
  test('createForUser : stocke l’empreinte, expose le secret une seule fois', async ({
    assert,
  }) => {
    const { user } = await createCandidate({ onboarded: false })

    const token = await OnboardingToken.createForUser(user.id)
    const row = await OnboardingToken.findOrFail(token.id)

    assert.match(token.plainToken!, /^[0-9a-f]{64}$/)
    assert.equal(row.token, OnboardingToken.hash(token.plainToken!))
    assert.notEqual(row.token, token.plainToken)
    assert.isUndefined(row.plainToken)
    assert.notProperty(row.serialize(), 'plainToken')
    assert.notProperty(row.serialize(), 'token')
    assert.isTrue(row.isValid())
  })

  test('createForUser : durée de validité paramétrable', async ({ assert }) => {
    const { user } = await createCandidate({ onboarded: false })

    const token = await OnboardingToken.createForUser(user.id, { expiresInDays: 1 })

    const hours = token.expiresAt.diffNow('hours').hours
    assert.isAbove(hours, 23)
    assert.isBelow(hours, 25)
  })
})
