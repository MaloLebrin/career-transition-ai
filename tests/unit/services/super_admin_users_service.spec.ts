import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { SuperAdminUsersService } from '#services/super_admin_users_service'
import Organization from '#models/organization'
import User from '#models/user'
import OnboardingToken from '#models/onboarding_token'
import EmailAlreadyUsedException from '#exceptions/email_already_used_exception'
import DomainException from '#exceptions/domain_exception'
import { DateTime } from 'luxon'

test.group('SuperAdminUsersService.createUserWithInvite', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates user, token and sends mail', async ({ assert }) => {
    const calls: unknown[] = []
    const platformOrg = await Organization.create({
      name: 'Platform',
      slug: `platform-${Date.now()}`,
    })
    const clientOrg = await Organization.create({
      name: 'Client',
      slug: `client-${Date.now()}`,
    })

    const service = new SuperAdminUsersService({
      sendSetPasswordLink: async (payload: unknown) => {
        calls.push(payload)
      },
    } as any)

    const user = await service.createUserWithInvite({
      organizationId: clientOrg.id,
      name: 'Alice',
      email: 'alice@client.test',
      role: 'advisor',
      baseUrl: 'https://app.test',
      platformOrganizationId: platformOrg.id,
    })

    assert.equal(user.organizationId, clientOrg.id)
    assert.equal(user.role, 'advisor')
    await user.refresh()
    assert.isNull(user.onboardingCompletedAt)

    const tokens = await OnboardingToken.query().where('userId', user.id)
    assert.lengthOf(tokens, 1)
    assert.isNull(tokens[0].usedAt)

    assert.equal(calls.length, 1)
  })

  test('throws when email exists in organization', async ({ assert }) => {
    const platformOrg = await Organization.create({
      name: 'Platform 2',
      slug: `platform-2-${Date.now()}`,
    })
    const clientOrg = await Organization.create({
      name: 'Client 2',
      slug: `client-2-${Date.now()}`,
    })

    await User.create({
      organizationId: clientOrg.id,
      email: 'dup@client.test',
      name: 'Existing',
      password: 'x',
      role: 'advisor',
    })

    const service = new SuperAdminUsersService({ sendSetPasswordLink: async () => {} } as any)

    await assert.rejects(
      () =>
        service.createUserWithInvite({
          organizationId: clientOrg.id,
          name: 'Bob',
          email: 'dup@client.test',
          role: 'admin',
          baseUrl: 'https://app.test',
          platformOrganizationId: platformOrg.id,
        }),
      EmailAlreadyUsedException
    )
  })

  test('throws when targeting platform organization', async ({ assert }) => {
    const platformOrg = await Organization.create({
      name: 'Platform 3',
      slug: `platform-3-${Date.now()}`,
    })

    const service = new SuperAdminUsersService({ sendSetPasswordLink: async () => {} } as any)

    await assert.rejects(
      () =>
        service.createUserWithInvite({
          organizationId: platformOrg.id,
          name: 'Eve',
          email: 'eve@test.com',
          role: 'employee',
          baseUrl: 'https://app.test',
          platformOrganizationId: platformOrg.id,
        }),
      DomainException
    )
  })
})

test.group('SuperAdminUsersService.resendOnboardingInvitation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates new token and sends mail when not onboarded', async ({ assert }) => {
    const calls: unknown[] = []
    const org = await Organization.create({ name: 'O', slug: `o-${Date.now()}` })
    const user = await User.create({
      organizationId: org.id,
      email: `u-${Date.now()}@t.c`,
      name: 'U',
      password: 'hashed',
      role: 'advisor',
    })

    const service = new SuperAdminUsersService({
      sendSetPasswordLink: async (p: unknown) => calls.push(p),
    } as any)

    await service.resendOnboardingInvitation(user, 'https://app.test')

    const tokens = await OnboardingToken.query().where('userId', user.id)
    assert.lengthOf(tokens, 1)
    assert.equal(calls.length, 1)
  })

  test('throws when user already completed onboarding', async ({ assert }) => {
    const org = await Organization.create({ name: 'O2', slug: `o2-${Date.now()}` })
    const user = await User.create({
      organizationId: org.id,
      email: `u2-${Date.now()}@t.c`,
      name: 'U2',
      password: 'hashed',
      role: 'advisor',
      onboardingCompletedAt: DateTime.now(),
    })

    const service = new SuperAdminUsersService({ sendSetPasswordLink: async () => {} } as any)

    await assert.rejects(
      () => service.resendOnboardingInvitation(user, 'https://app.test'),
      DomainException
    )
  })

  test('deletes unused tokens before creating a new one', async ({ assert }) => {
    const org = await Organization.create({ name: 'O3', slug: `o3-${Date.now()}` })
    const user = await User.create({
      organizationId: org.id,
      email: `u3-${Date.now()}@t.c`,
      name: 'U3',
      password: 'hashed',
      role: 'employee',
    })

    await OnboardingToken.create({
      userId: user.id,
      token: 'old-unused',
      expiresAt: DateTime.now().plus({ days: 1 }),
      usedAt: null,
    })

    const service = new SuperAdminUsersService({ sendSetPasswordLink: async () => {} } as any)
    await service.resendOnboardingInvitation(user, 'https://app.test')

    const tokens = await OnboardingToken.query().where('userId', user.id)
    assert.lengthOf(tokens, 1)
    assert.notEqual(tokens[0].token, 'old-unused')
  })
})

test.group('SuperAdminUsersService.hasCompletedOnboarding', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns true when onboarding_completed_at is set', async ({ assert }) => {
    const org = await Organization.create({ name: 'O4', slug: `o4-${Date.now()}` })
    const user = await User.create({
      organizationId: org.id,
      email: `u4-${Date.now()}@t.c`,
      name: 'U4',
      password: 'h',
      role: 'advisor',
      onboardingCompletedAt: DateTime.now(),
    })

    assert.isTrue(await SuperAdminUsersService.hasCompletedOnboarding(user.id))
  })

  test('returns false when onboarding_completed_at is null', async ({ assert }) => {
    const org = await Organization.create({ name: 'O5', slug: `o5-${Date.now()}` })
    const user = await User.create({
      organizationId: org.id,
      email: `u5-${Date.now()}@t.c`,
      name: 'U5',
      password: 'h',
      role: 'advisor',
      onboardingCompletedAt: null,
    })
    assert.isFalse(await SuperAdminUsersService.hasCompletedOnboarding(user.id))
  })
})
