import { EmailAlreadyVerifiedError } from '#exceptions/email_verification_errors'
import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import { EmailVerificationService } from '#services/email_verification_service'
import {
  EMAIL_VERIFICATION_TOKEN_TTL_DAYS,
  type EmailVerificationMailService,
} from '#services/mail/email_verification_mail_service'
import { OnboardingTokensService } from '#services/onboarding_tokens_service'
import { createB2cCandidate } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/** Double de `EmailVerificationMailService` : garde les envois, peut simuler une panne. */
function makeService(options: { failing?: boolean } = {}) {
  const links: Array<{ userId: number; plainToken?: string }> = []
  const mails = {
    async sendVerificationLink({ user, token }: { user: User; token: OnboardingToken }) {
      if (options.failing) throw new Error('provider down')
      links.push({ userId: user.id, plainToken: token.plainToken })
    },
  } as unknown as EmailVerificationMailService
  return { service: new EmailVerificationService(mails, new OnboardingTokensService()), links }
}

async function activeTokens(userId: number) {
  return OnboardingToken.query().where('userId', userId).whereNull('usedAt')
}

test.group('EmailVerificationService.sendLink', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('crée un jeton haché valable 7 jours et envoie son secret', async ({ assert }) => {
    const { user } = await createB2cCandidate()
    const { service, links } = makeService()

    await service.sendLink(user)

    assert.lengthOf(links, 1)
    const [sent] = links
    assert.equal(sent.userId, user.id)
    const [row] = await activeTokens(user.id)
    assert.equal(row.token, OnboardingToken.hash(sent.plainToken!))
    assert.notEqual(row.token, sent.plainToken)
    const ttl = row.expiresAt.diff(DateTime.now(), 'days').days
    assert.closeTo(ttl, EMAIL_VERIFICATION_TOKEN_TTL_DAYS, 0.1)
  })

  test('un seul lien actif par compte : les précédents sont invalidés', async ({ assert }) => {
    const { user } = await createB2cCandidate()
    const previous = await OnboardingToken.createForUser(user.id)
    const { service } = makeService()

    await service.sendLink(user)

    await previous.refresh()
    assert.isNotNull(previous.usedAt)
    assert.lengthOf(await activeTokens(user.id), 1)
  })

  test('une panne du fournisseur remonte (le renvoi explicite doit l’afficher)', async ({
    assert,
  }) => {
    const { user } = await createB2cCandidate()
    const { service } = makeService({ failing: true })

    await assert.rejects(() => service.sendLink(user), 'provider down')
  })
})

test.group('EmailVerificationService.sendLinkSafely', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('absorbe une panne d’envoi : l’inscription ne doit pas échouer', async ({ assert }) => {
    const { user } = await createB2cCandidate()
    const { service, links } = makeService({ failing: true })

    await service.sendLinkSafely(user)

    assert.lengthOf(links, 0)
  })

  test('envoie normalement sinon', async ({ assert }) => {
    const { user } = await createB2cCandidate()
    const { service, links } = makeService()

    await service.sendLinkSafely(user)

    assert.lengthOf(links, 1)
  })
})

test.group('EmailVerificationService.resend', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('adresse non vérifiée : envoie un nouveau lien', async ({ assert }) => {
    const { user } = await createB2cCandidate()
    const { service, links } = makeService()

    await service.resend(user)

    assert.lengthOf(links, 1)
  })

  test('adresse déjà vérifiée : EmailAlreadyVerifiedError (409), aucun envoi', async ({
    assert,
  }) => {
    const { user } = await createB2cCandidate({ emailVerified: true })
    const { service, links } = makeService()

    const error = await service.resend(user).then(
      () => null,
      (e: unknown) => e
    )

    assert.instanceOf(error, EmailAlreadyVerifiedError)
    assert.equal((error as EmailAlreadyVerifiedError).status, 409)
    assert.equal((error as EmailAlreadyVerifiedError).code, 'E_EMAIL_ALREADY_VERIFIED')
    assert.lengthOf(links, 0)
    assert.lengthOf(await activeTokens(user.id), 0)
  })
})

test.group('EmailVerificationService.verify', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('secret valide : vérifie l’adresse, consomme le jeton et renvoie l’utilisateur', async ({
    assert,
  }) => {
    const { user } = await createB2cCandidate()
    const token = await OnboardingToken.createForUser(user.id)
    const { service } = makeService()

    const verified = await service.verify(token.plainToken!)

    assert.equal(verified?.id, user.id)
    const fresh = await User.findOrFail(user.id)
    assert.isNotNull(fresh.emailVerifiedAt)
    await token.refresh()
    assert.isNotNull(token.usedAt)
  })

  test('secret inconnu, vide, expiré ou consommé : null et adresse non vérifiée', async ({
    assert,
  }) => {
    const { user } = await createB2cCandidate()
    const expired = await OnboardingToken.createForUser(user.id)
    expired.expiresAt = DateTime.now().minus({ minutes: 1 })
    await expired.save()
    const used = await OnboardingToken.createForUser(user.id)
    used.usedAt = DateTime.now()
    await used.save()
    const { service } = makeService()

    assert.isNull(await service.verify('inconnu'))
    assert.isNull(await service.verify(''))
    assert.isNull(await service.verify(expired.plainToken!))
    assert.isNull(await service.verify(used.plainToken!))
    const fresh = await User.findOrFail(user.id)
    assert.isNull(fresh.emailVerifiedAt)
  })
})
