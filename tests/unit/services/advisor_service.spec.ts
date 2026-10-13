import EmailAlreadyUsedException from '#exceptions/email_already_used_exception'
import { AdvisorLicenseLimitReachedError } from '#exceptions/team_errors'
import { MAX_LICENSES_ADVISORS } from '#shared/constants/organisation'
import OnboardingToken from '#models/onboarding_token'
import type Organization from '#models/organization'
import User from '#models/user'
import { AdvisorService } from '#services/advisor_service'
import type { OnboardingMailService } from '#services/onboarding_mail_service'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { createAdvisor, createOrganization } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

type InviteCall = Parameters<OnboardingMailService['sendInviteAdvisorLink']>[0]

/** Faux service d'e-mail : enregistre les invitations au lieu de les envoyer. */
function makeService() {
  const invites: InviteCall[] = []
  const mail = {
    async sendInviteAdvisorLink(args: InviteCall) {
      invites.push(args)
    },
  } as unknown as OnboardingMailService
  return { service: new AdvisorService(mail), invites }
}

test.group('AdvisorService.inviteAdvisor', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('crée un conseiller, un jeton d’onboarding et envoie l’invitation', async ({ assert }) => {
    const { service, invites } = makeService()
    const org = await createOrganization()

    const dto = await service.inviteAdvisor({
      organizationId: org.id,
      name: 'Claire Martin',
      email: 'claire@example.com',
      role: 'advisor',
    })

    assert.deepEqual(dto, {
      id: dto.id,
      organizationId: org.id,
      email: 'claire@example.com',
      name: 'Claire Martin',
      role: 'advisor',
      disabledAt: null,
    })

    const user = await User.findOrFail(dto.id)
    assert.equal(user.role, USERS_ROLES.ADVISOR)
    assert.equal(user.organizationId, org.id)

    const tokens = await OnboardingToken.query().where('userId', user.id)
    assert.lengthOf(tokens, 1)
    assert.isTrue(tokens[0].isValid())

    assert.lengthOf(invites, 1)
    const [invite] = invites
    assert.equal(invite.user.id, user.id)
    assert.equal((invite.organization as Organization).id, org.id)
    assert.equal(invite.token.id, tokens[0].id)
  })

  test('le rôle « admin » donne un compte admin', async ({ assert }) => {
    const { service } = makeService()
    const org = await createOrganization()

    const dto = await service.inviteAdvisor({
      organizationId: org.id,
      name: 'Admin',
      email: 'admin@example.com',
      role: 'admin',
    })

    assert.equal(dto.role, 'admin')
    const reloaded = await User.findOrFail(dto.id)
    assert.equal(reloaded.role, USERS_ROLES.ADMIN)
  })

  test('le rôle « advisor » donne un compte conseiller', async ({ assert }) => {
    const { service } = makeService()
    const org = await createOrganization()

    const dto = await service.inviteAdvisor({
      organizationId: org.id,
      name: 'Conseil',
      email: 'conseil@example.com',
      role: 'advisor',
    })

    assert.equal(dto.role, 'advisor')
    const reloaded = await User.findOrFail(dto.id)
    assert.equal(reloaded.role, USERS_ROLES.ADVISOR)
  })

  test('licences : refuse au-delà de MAX_LICENSES_ADVISORS, sans mail ni compte', async ({
    assert,
  }) => {
    const { service, invites } = makeService()
    const org = await createOrganization()
    for (let i = 0; i < MAX_LICENSES_ADVISORS; i++) await createAdvisor(org)

    await assert.rejects(
      () =>
        service.inviteAdvisor({
          organizationId: org.id,
          name: 'Trop',
          email: 'trop@example.com',
          role: 'advisor',
        }),
      AdvisorLicenseLimitReachedError
    )
    assert.lengthOf(invites, 0)
    assert.isNull(await User.findBy('email', 'trop@example.com'))
  })

  test('le mot de passe temporaire est aléatoire et haché', async ({ assert }) => {
    const { service } = makeService()
    const org = await createOrganization()

    const a = await service.inviteAdvisor({
      organizationId: org.id,
      name: 'A',
      email: 'a@example.com',
      role: 'advisor',
    })
    const b = await service.inviteAdvisor({
      organizationId: org.id,
      name: 'B',
      email: 'b@example.com',
      role: 'advisor',
    })

    const userA = await User.findOrFail(a.id)
    const userB = await User.findOrFail(b.id)
    assert.notEqual(userA.password, userB.password)
    assert.notMatch(userA.password, /^[0-9a-f]{64}$/)
  })

  test('refuse un e-mail déjà utilisé dans l’organisation, sans tenir compte de la casse', async ({
    assert,
  }) => {
    const { service, invites } = makeService()
    const existing = await createAdvisor()

    const error = await service
      .inviteAdvisor({
        organizationId: existing.organizationId,
        name: 'Doublon',
        email: existing.email.toUpperCase(),
        role: 'advisor',
      })
      .catch((e) => e)

    assert.instanceOf(error, EmailAlreadyUsedException)
    assert.equal(error.message, 'Cet email est déjà utilisé par un compte existant.')
    assert.lengthOf(invites, 0)
    const count = await User.query()
      .where('organizationId', existing.organizationId)
      .count('* as total')
      .firstOrFail()
    assert.equal(Number(count.$extras.total), 1)
  })

  test('le même e-mail reste disponible dans une autre organisation', async ({ assert }) => {
    const { service } = makeService()
    const existing = await createAdvisor()
    const otherOrg = await createOrganization()

    const dto = await service.inviteAdvisor({
      organizationId: otherOrg.id,
      name: 'Homonyme',
      email: existing.email,
      role: 'advisor',
    })

    assert.equal(dto.organizationId, otherOrg.id)
    assert.notEqual(dto.id, existing.id)
  })
})
