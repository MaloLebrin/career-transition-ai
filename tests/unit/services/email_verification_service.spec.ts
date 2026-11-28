import {
  EmailAlreadyVerifiedError,
  EmailChangeConflictError,
  EmailChangeLinkNotSentError,
} from '#exceptions/email_verification_errors'
import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import { EmailVerificationService } from '#services/email_verification_service'
import {
  EMAIL_VERIFICATION_TOKEN_TTL_DAYS,
  type EmailVerificationMailService,
} from '#services/mail/email_verification_mail_service'
import { OnboardingTokensService } from '#services/onboarding_tokens_service'
import { createAdvisor, createB2cCandidate } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/** Double de `EmailVerificationMailService` : garde les envois, peut simuler une panne. */
function makeService(
  options: { failing?: boolean; failingNotice?: boolean; failingChangeLink?: boolean } = {}
) {
  const links: Array<{ userId: number; plainToken?: string }> = []
  const changeLinks: Array<{ userId: number; to: string | null; plainToken?: string }> = []
  const notices: Array<{ userId: number; to: string; newEmail: string }> = []
  const mails = {
    async sendVerificationLink({ user, token }: { user: User; token: OnboardingToken }) {
      if (options.failing) throw new Error('provider down')
      links.push({ userId: user.id, plainToken: token.plainToken })
    },
    async sendEmailChangeLink({ user, token }: { user: User; token: OnboardingToken }) {
      if (options.failingChangeLink) throw new Error('provider down')
      changeLinks.push({ userId: user.id, to: token.newEmail, plainToken: token.plainToken })
    },
    async sendEmailChangedNotice({ user, previousEmail }: { user: User; previousEmail: string }) {
      if (options.failingNotice) throw new Error('provider down')
      notices.push({ userId: user.id, to: previousEmail, newEmail: user.email })
    },
  } as unknown as EmailVerificationMailService
  return {
    service: new EmailVerificationService(mails, new OnboardingTokensService()),
    links,
    changeLinks,
    notices,
  }
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

    const result = await service.verify(token.plainToken!)

    assert.deepEqual(result, { outcome: 'verified' })
    const fresh = await User.findOrFail(user.id)
    assert.isNotNull(fresh.emailVerifiedAt)
    await token.refresh()
    assert.isNotNull(token.usedAt)
  })

  test('secret inconnu, vide, expiré ou consommé : invalid et adresse non vérifiée', async ({
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

    const invalid = { outcome: 'invalid' }
    assert.deepEqual(await service.verify('inconnu'), invalid)
    assert.deepEqual(await service.verify(''), invalid)
    assert.deepEqual(await service.verify(expired.plainToken!), invalid)
    assert.deepEqual(await service.verify(used.plainToken!), invalid)
    const fresh = await User.findOrFail(user.id)
    assert.isNull(fresh.emailVerifiedAt)
  })
})

test.group('EmailVerificationService.requestEmailChange (#143)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('envoie un lien à la nouvelle adresse sans toucher à celle du compte', async ({
    assert,
  }) => {
    const advisor = await createAdvisor()
    const before = advisor.email
    const { service, changeLinks } = makeService()

    const pending = await service.requestEmailChange(advisor, '  nouvelle@example.com ')

    assert.equal(pending, 'nouvelle@example.com')
    assert.deepEqual(
      changeLinks.map((l) => [l.userId, l.to]),
      [[advisor.id, 'nouvelle@example.com']]
    )
    const fresh = await User.findOrFail(advisor.id)
    assert.equal(fresh.email, before)
    const [row] = await activeTokens(advisor.id)
    assert.equal(row.newEmail, 'nouvelle@example.com')
    assert.equal(row.token, OnboardingToken.hash(changeLinks[0].plainToken!))
    assert.equal(await service.pendingEmailFor(advisor), 'nouvelle@example.com')
  })

  test('enregistre la nouvelle adresse en minuscules', async ({ assert }) => {
    const advisor = await createAdvisor()
    const { service, changeLinks } = makeService()

    assert.equal(
      await service.requestEmailChange(advisor, 'Claire.Conseil@Example.com'),
      'claire.conseil@example.com'
    )
    assert.equal(changeLinks[0].to, 'claire.conseil@example.com')
  })

  /** Revue de #143 : pas de « confirmation en attente » pour un lien jamais parti. */
  test('échec d’envoi du lien : erreur dédiée, demande annulée', async ({ assert }) => {
    const advisor = await createAdvisor()
    const { service } = makeService({ failingChangeLink: true })

    await assert.rejects(
      () => service.requestEmailChange(advisor, 'nouvelle@example.com'),
      EmailChangeLinkNotSentError
    )
    assert.isNull(await service.pendingEmailFor(advisor))
    assert.lengthOf(await activeTokens(advisor.id), 0)
  })

  test('même adresse (casse comprise) : rien n’est envoyé', async ({ assert }) => {
    const advisor = await createAdvisor()
    const { service, changeLinks } = makeService()

    assert.isNull(await service.requestEmailChange(advisor, advisor.email.toUpperCase()))
    assert.lengthOf(changeLinks, 0)
    assert.isNull(await service.pendingEmailFor(advisor))
  })

  test('adresse d’un autre compte (casse comprise) : refus, aucun lien', async ({ assert }) => {
    const advisor = await createAdvisor()
    const other = await createAdvisor()
    const { service, changeLinks } = makeService()

    await assert.rejects(
      () => service.requestEmailChange(advisor, other.email.toUpperCase()),
      EmailChangeConflictError
    )
    assert.lengthOf(changeLinks, 0)
  })

  test('une seule demande en cours : la dernière adresse l’emporte, l’onboarding est intact', async ({
    assert,
  }) => {
    const advisor = await createAdvisor()
    const onboarding = await OnboardingToken.createForUser(advisor.id)
    const { service, changeLinks } = makeService()

    await service.requestEmailChange(advisor, 'premiere@example.com')
    await service.requestEmailChange(advisor, 'seconde@example.com')

    const active = await activeTokens(advisor.id)
    assert.sameMembers(
      active.map((t) => t.newEmail),
      [null, 'seconde@example.com']
    )
    assert.include(
      active.map((t) => t.id),
      onboarding.id
    )
    assert.equal(await service.pendingEmailFor(advisor), 'seconde@example.com')
    assert.deepEqual(await service.verify(changeLinks[0].plainToken!), { outcome: 'invalid' })
  })
})

test.group('EmailVerificationService.verify — changement d’e-mail (#143)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('applique la nouvelle adresse, la tient pour vérifiée et prévient l’ancienne', async ({
    assert,
  }) => {
    const advisor = await createAdvisor()
    const previous = advisor.email
    const { service, changeLinks, notices } = makeService()
    await service.requestEmailChange(advisor, 'nouvelle@example.com')

    const result = await service.verify(changeLinks[0].plainToken!)

    assert.deepEqual(result, { outcome: 'email_changed' })
    const fresh = await User.findOrFail(advisor.id)
    assert.equal(fresh.email, 'nouvelle@example.com')
    assert.isNotNull(fresh.emailVerifiedAt)
    assert.deepEqual(notices, [
      { userId: advisor.id, to: previous, newEmail: 'nouvelle@example.com' },
    ])
    assert.isNull(await service.pendingEmailFor(fresh))
  })

  test('un échec de l’avis à l’ancienne adresse n’annule pas le changement', async ({ assert }) => {
    const advisor = await createAdvisor()
    const { service, changeLinks } = makeService({ failingNotice: true })
    await service.requestEmailChange(advisor, 'nouvelle@example.com')

    const result = await service.verify(changeLinks[0].plainToken!)

    assert.deepEqual(result, { outcome: 'email_changed' })
    const changed = await User.findOrFail(advisor.id)
    assert.equal(changed.email, 'nouvelle@example.com')
  })

  test('adresse prise entre l’envoi et le clic : email_taken, rien ne change', async ({
    assert,
  }) => {
    const advisor = await createAdvisor()
    const previous = advisor.email
    const { service, changeLinks, notices } = makeService()
    await service.requestEmailChange(advisor, 'convoitee@example.com')
    const other = await createAdvisor()
    other.email = 'Convoitee@example.com'
    await other.save()

    const result = await service.verify(changeLinks[0].plainToken!)

    assert.deepEqual(result, { outcome: 'email_taken' })
    const unchanged = await User.findOrFail(advisor.id)
    assert.equal(unchanged.email, previous)
    assert.lengthOf(notices, 0)
  })
})
