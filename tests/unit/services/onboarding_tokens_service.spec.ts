import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import { OnboardingTokensService } from '#services/onboarding_tokens_service'
import { createB2cCandidate, createCandidate } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import hash from '@adonisjs/core/services/hash'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const service = new OnboardingTokensService()

test.group('OnboardingTokensService.findByPlainToken', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('retrouve le jeton et son utilisateur depuis le secret du lien', async ({ assert }) => {
    const { user } = await createCandidate({ onboarded: false })
    const token = await OnboardingToken.createForUser(user.id)

    const found = await service.findByPlainToken(token.plainToken!)

    assert.equal(found?.id, token.id)
    assert.equal(found?.user.id, user.id)
  })

  /** Régression #65 : la valeur stockée ne sert plus de lien (fuite de base). */
  test('l’empreinte stockée ne retrouve rien, un secret inconnu non plus', async ({ assert }) => {
    const { user } = await createCandidate({ onboarded: false })
    const token = await OnboardingToken.createForUser(user.id)
    const row = await OnboardingToken.findOrFail(token.id)

    assert.notEqual(row.token, token.plainToken)
    assert.isNull(await service.findByPlainToken(row.token))
    assert.isNull(await service.findByPlainToken('inconnu'))
    assert.isNull(await service.findByPlainToken(''))
  })
})

test.group('OnboardingTokensService.consume', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('enregistre le mot de passe, termine l’onboarding et consomme le jeton', async ({
    assert,
  }) => {
    const { user } = await createCandidate({ onboarded: false })
    const token = await OnboardingToken.createForUser(user.id)
    const record = (await service.findByPlainToken(token.plainToken!))!

    const returned = await service.consume(record, 'nouveau-mot-de-passe')

    assert.equal(returned.id, user.id)
    const fresh = await User.findOrFail(user.id)
    assert.isNotNull(fresh.onboardingCompletedAt)
    // Le lien prouve l'accès à la boîte mail : l'adresse est vérifiée (#98).
    assert.isNotNull(fresh.emailVerifiedAt)
    assert.isTrue(await hash.verify(fresh.password, 'nouveau-mot-de-passe'))
    await token.refresh()
    assert.isNotNull(token.usedAt)
    assert.isFalse(token.isValid())
  })

  test('ne remplace pas une date de vérification déjà posée', async ({ assert }) => {
    const { user } = await createCandidate({ onboarded: false })
    const verifiedAt = DateTime.now().minus({ days: 2 }).startOf('second')
    user.emailVerifiedAt = verifiedAt
    await user.save()
    const token = await OnboardingToken.createForUser(user.id)
    const record = (await service.findByPlainToken(token.plainToken!))!

    await service.consume(record, 'nouveau-mot-de-passe')

    const fresh = await User.findOrFail(user.id)
    assert.equal(fresh.emailVerifiedAt?.toISO(), verifiedAt.toISO())
  })
})

test.group('OnboardingTokensService.consumeForEmailVerification (#98)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('pose emailVerifiedAt et consomme le jeton sans toucher au mot de passe ni à l’onboarding', async ({
    assert,
  }) => {
    const { user } = await createB2cCandidate({ onboarded: false })
    const before = await User.findOrFail(user.id)
    const passwordBefore = before.password
    const token = await OnboardingToken.createForUser(user.id)
    const record = (await service.findByPlainToken(token.plainToken!))!

    const returned = await service.consumeForEmailVerification(record)

    assert.equal(returned.id, user.id)
    const fresh = await User.findOrFail(user.id)
    assert.isNotNull(fresh.emailVerifiedAt)
    assert.equal(fresh.password, passwordBefore)
    assert.equal(
      fresh.onboardingCompletedAt?.toISO() ?? null,
      user.onboardingCompletedAt?.toISO() ?? null
    )
    await token.refresh()
    assert.isNotNull(token.usedAt)
    assert.isFalse(token.isValid())
  })

  test('adresse déjà vérifiée : garde la première date, consomme quand même le jeton', async ({
    assert,
  }) => {
    const { user } = await createB2cCandidate({ emailVerified: true })
    const before = await User.findOrFail(user.id)
    const verifiedAt = before.emailVerifiedAt!
    const token = await OnboardingToken.createForUser(user.id)
    const record = (await service.findByPlainToken(token.plainToken!))!

    await service.consumeForEmailVerification(record)

    const fresh = await User.findOrFail(user.id)
    assert.equal(fresh.emailVerifiedAt?.toISO(), verifiedAt.toISO())
    await token.refresh()
    assert.isNotNull(token.usedAt)
  })
})
