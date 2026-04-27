import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { SuperAdminOrganizationsService } from '#services/super_admin_organizations_service'
import Organization from '#models/organization'
import User from '#models/user'
import OnboardingToken from '#models/onboarding_token'
import EmailAlreadyUsedException from '#exceptions/email_already_used_exception'
import OrganizationNameAlreadyUsedException from '#exceptions/organization_name_already_used_exception'

test.group('SuperAdminOrganizationsService.createOrganizationWithOwner', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates organization + owner admin + token and sends email', async ({ assert }) => {
    const calls: any[] = []
    const service = new SuperAdminOrganizationsService({
      sendSetPasswordLink: async (payload: any) => {
        calls.push(payload)
      },
    } as any)

    const result = await service.createOrganizationWithOwner({
      organizationName: 'Cabinet New',
      organizationSlug: '',
      ownerName: 'Alice Owner',
      ownerEmail: 'alice.owner@example.com',
      baseUrl: 'https://example.test',
    })

    assert.exists(result.organization.id)
    assert.exists(result.owner.id)
    assert.exists(result.token.id)
    assert.equal(result.owner.role, 'admin')
    assert.equal(result.owner.organizationId, result.organization.id)
    assert.equal(result.token.userId, result.owner.id)

    const orgInDb = await Organization.find(result.organization.id)
    const userInDb = await User.find(result.owner.id)
    const tokenInDb = await OnboardingToken.find(result.token.id)
    assert.isNotNull(orgInDb)
    assert.isNotNull(userInDb)
    assert.isNotNull(tokenInDb)

    assert.equal(calls.length, 1)
    assert.equal(calls[0].user.id, result.owner.id)
    assert.equal(calls[0].baseUrl, 'https://example.test')
    assert.equal(calls[0].token.id, result.token.id)
  })

  test('throws when owner email already exists', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Existing Org',
      slug: `existing-org-${Date.now()}`,
    })
    await User.create({
      organizationId: org.id,
      email: 'existing@example.com',
      name: 'Existing',
      password: 'temp',
      role: 'advisor',
    })

    const service = new SuperAdminOrganizationsService({
      sendSetPasswordLink: async () => {},
    } as any)

    await assert.rejects(
      () =>
        service.createOrganizationWithOwner({
          organizationName: 'Cabinet Another',
          organizationSlug: '',
          ownerName: 'Owner',
          ownerEmail: 'existing@example.com',
          baseUrl: 'https://example.test',
        }),
      EmailAlreadyUsedException
    )
  })

  test('throws when organization name already exists', async ({ assert }) => {
    await Organization.create({ name: 'Dup Org', slug: `dup-org-${Date.now()}` })
    const service = new SuperAdminOrganizationsService({
      sendSetPasswordLink: async () => {},
    } as any)

    await assert.rejects(
      () =>
        service.createOrganizationWithOwner({
          organizationName: 'Dup Org',
          organizationSlug: '',
          ownerName: 'Owner',
          ownerEmail: 'new-owner@example.com',
          baseUrl: 'https://example.test',
        }),
      OrganizationNameAlreadyUsedException
    )
  })
})
