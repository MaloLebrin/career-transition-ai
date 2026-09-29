import { PasswordResetTokenFactory } from '#database/factories/password_reset_token_factory'
import {
  InvalidCurrentPasswordError,
  InvalidPasswordResetTokenError,
} from '#exceptions/password_errors'
import { SuperAdminUserNotFoundError } from '#exceptions/super_admin_user_errors'
import PasswordResetToken, { PASSWORD_RESET_TOKEN_TTL_MINUTES } from '#models/password_reset_token'
import User from '#models/user'
import type { PasswordMailService } from '#services/mail/password_mail_service'
import { PasswordsService } from '#services/passwords_service'
import { PASSWORD, withPassword } from '#tests/functional/auth/helpers'
import { createAdvisor, createCandidate } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import hash from '@adonisjs/core/services/hash'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const NEW_PASSWORD = 'nouveau-mot-de-passe'

/** Double de `PasswordMailService` : garde les envois, peut simuler une panne. */
function makeService(options: { failing?: boolean } = {}) {
  const resetLinks: Array<{ userId: number; plainToken?: string }> = []
  const changed: number[] = []
  const mails = {
    async sendResetLink({ user, token }: { user: User; token: PasswordResetToken }) {
      if (options.failing) throw new Error('provider down')
      resetLinks.push({ userId: user.id, plainToken: token.plainToken })
    },
    async sendPasswordChanged({ user }: { user: User }) {
      if (options.failing) throw new Error('provider down')
      changed.push(user.id)
    },
  } as unknown as PasswordMailService
  return { service: new PasswordsService(mails), resetLinks, changed }
}

async function activeTokens(userId: number) {
  return PasswordResetToken.query().where('userId', userId).whereNull('usedAt')
}

test.group('PasswordsService.requestReset', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('crée un jeton haché valable 1 h et envoie son secret par e-mail', async ({ assert }) => {
    const advisor = await createAdvisor()
    const { service, resetLinks } = makeService()

    await service.requestReset(advisor.email)

    assert.lengthOf(resetLinks, 1)
    const [sent] = resetLinks
    assert.equal(sent.userId, advisor.id)
    const [row] = await activeTokens(advisor.id)
    // La base ne garde que l'empreinte du secret envoyé.
    assert.equal(row.token, PasswordResetToken.hash(sent.plainToken!))
    assert.notEqual(row.token, sent.plainToken)
    const ttl = row.expiresAt.diff(DateTime.now(), 'minutes').minutes
    assert.closeTo(ttl, PASSWORD_RESET_TOKEN_TTL_MINUTES, 1)
  })

  test('retrouve le compte sans tenir compte de la casse ni des espaces', async ({ assert }) => {
    const advisor = await createAdvisor()
    const { service, resetLinks } = makeService()

    await service.requestReset(`  ${advisor.email.toUpperCase()} `)

    assert.lengthOf(resetLinks, 1)
  })

  test('e-mail inconnu : ne fait rien et ne lève pas', async ({ assert }) => {
    const { service, resetLinks } = makeService()

    await service.requestReset('personne@example.com')

    assert.lengthOf(resetLinks, 0)
    assert.lengthOf(await PasswordResetToken.all(), 0)
  })

  test('une nouvelle demande invalide le lien précédent', async ({ assert }) => {
    const advisor = await createAdvisor()
    const { service, resetLinks } = makeService()

    await service.requestReset(advisor.email)
    await service.requestReset(advisor.email)

    const active = await activeTokens(advisor.id)
    assert.lengthOf(active, 1)
    assert.equal(active[0].token, PasswordResetToken.hash(resetLinks[1].plainToken!))
  })

  test('un échec d’envoi ne remonte pas (pas d’énumération des comptes)', async ({ assert }) => {
    const advisor = await createAdvisor()
    const { service } = makeService({ failing: true })

    await assert.doesNotReject(() => service.requestReset(advisor.email))
  })
})

test.group('PasswordsService.sendResetLinkTo', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('envoie un lien sans toucher au mot de passe', async ({ assert }) => {
    const advisor = await withPassword(await createAdvisor())
    const { service, resetLinks } = makeService()

    const user = await service.sendResetLinkTo(advisor.id)

    assert.equal(user.id, advisor.id)
    assert.lengthOf(resetLinks, 1)
    const reloaded = await User.findOrFail(advisor.id)
    assert.isTrue(await hash.verify(reloaded.password, PASSWORD))
  })

  test('utilisateur inconnu → SuperAdminUserNotFoundError', async ({ assert }) => {
    const { service } = makeService()

    await assert.rejects(() => service.sendResetLinkTo(999999), SuperAdminUserNotFoundError)
  })
})

test.group('PasswordsService.resetWithToken', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('enregistre le mot de passe, consomme le lien et confirme par e-mail', async ({
    assert,
  }) => {
    const advisor = await withPassword(await createAdvisor())
    const token = await PasswordResetToken.createForUser(advisor.id)
    const { service, changed } = makeService()

    const user = await service.resetWithToken(token.plainToken!, NEW_PASSWORD)

    assert.equal(user.id, advisor.id)
    const reloaded = await User.findOrFail(advisor.id)
    assert.isTrue(await hash.verify(reloaded.password, NEW_PASSWORD))
    await token.refresh()
    assert.isFalse(token.isValid())
    assert.deepEqual(changed, [advisor.id])
  })

  test('termine l’onboarding d’un compte qui ne l’avait pas fait', async ({ assert }) => {
    const { user } = await createCandidate({ onboarded: false })
    const token = await PasswordResetToken.createForUser(user.id)
    const { service } = makeService()

    await service.resetWithToken(token.plainToken!, NEW_PASSWORD)

    const reloaded = await User.findOrFail(user.id)
    assert.isNotNull(reloaded.onboardingCompletedAt)
  })

  test('lien inconnu, expiré ou déjà utilisé → InvalidPasswordResetTokenError', async ({
    assert,
  }) => {
    const advisor = await withPassword(await createAdvisor())
    const expired = await PasswordResetTokenFactory.merge({ userId: advisor.id })
      .apply('expired')
      .create()
    const used = await PasswordResetTokenFactory.merge({ userId: advisor.id })
      .apply('used')
      .create()
    const { service, changed } = makeService()

    for (const secret of ['inconnu', expired.plainToken!, used.plainToken!, expired.token]) {
      await assert.rejects(
        () => service.resetWithToken(secret, NEW_PASSWORD),
        InvalidPasswordResetTokenError
      )
    }
    const reloaded = await User.findOrFail(advisor.id)
    assert.isTrue(await hash.verify(reloaded.password, PASSWORD))
    assert.lengthOf(changed, 0)
  })

  test('le mot de passe reste enregistré si l’e-mail de confirmation échoue', async ({
    assert,
  }) => {
    const advisor = await withPassword(await createAdvisor())
    const token = await PasswordResetToken.createForUser(advisor.id)
    const { service } = makeService({ failing: true })

    await service.resetWithToken(token.plainToken!, NEW_PASSWORD)

    const reloaded = await User.findOrFail(advisor.id)
    assert.isTrue(await hash.verify(reloaded.password, NEW_PASSWORD))
  })
})

test.group('PasswordsService.change', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('change le mot de passe, invalide les liens en cours et confirme par e-mail', async ({
    assert,
  }) => {
    const advisor = await withPassword(await createAdvisor())
    await PasswordResetToken.createForUser(advisor.id)
    const { service, changed } = makeService()

    await service.change(advisor, { currentPassword: PASSWORD, password: NEW_PASSWORD })

    const reloaded = await User.findOrFail(advisor.id)
    assert.isTrue(await hash.verify(reloaded.password, NEW_PASSWORD))
    assert.lengthOf(await activeTokens(advisor.id), 0)
    assert.deepEqual(changed, [advisor.id])
  })

  test('mot de passe actuel faux → InvalidCurrentPasswordError, rien ne change', async ({
    assert,
  }) => {
    const advisor = await withPassword(await createAdvisor())
    const { service, changed } = makeService()

    await assert.rejects(
      () => service.change(advisor, { currentPassword: 'faux', password: NEW_PASSWORD }),
      InvalidCurrentPasswordError
    )

    const reloaded = await User.findOrFail(advisor.id)
    assert.isTrue(await hash.verify(reloaded.password, PASSWORD))
    assert.lengthOf(changed, 0)
  })
})
