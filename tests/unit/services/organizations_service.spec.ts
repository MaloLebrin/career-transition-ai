import { test } from '@japa/runner'
import hash from '@adonisjs/core/services/hash'
import { OrganizationsService } from '#services/organizations_service'
import Organization from '#models/organization'
import User from '#models/user'
import { USERS_ROLES } from '#models/user'

function uniqueSlug() {
  return `org-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

test.group('OrganizationsService', () => {
  test('getById returns OrganizationDto when org exists', async ({ assert }) => {
    const service = new OrganizationsService()
    const org = await Organization.create({
      name: 'Test Org',
      slug: uniqueSlug(),
      logoUrl: null,
    })
    const dto = await service.getById(org.id)
    assert.isNotNull(dto)
    assert.equal(dto!.id, String(org.id))
    assert.equal(dto!.name, 'Test Org')
    assert.equal(dto!.slug, org.slug)
  })

  test('getById returns null when org does not exist', async ({ assert }) => {
    const service = new OrganizationsService()
    const dto = await service.getById(999999)
    assert.isNull(dto)
  })

  test('update merges fields and returns OrganizationDto', async ({ assert }) => {
    const service = new OrganizationsService()
    const slug = uniqueSlug()
    const org = await Organization.create({
      name: 'Original',
      slug,
      logoUrl: null,
    })
    const dto = await service.update(org, { name: 'Updated' })
    assert.equal(dto.name, 'Updated')
    assert.isDefined(dto.slug)
  })

  test('listAdvisors returns advisors of organization', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Org Advisors',
      slug: uniqueSlug(),
      logoUrl: null,
    })
    const user = await User.create({
      organizationId: org.id,
      email: 'advisor@test.com',
      name: 'Advisor One',
      password: await hash.make('secret'),
      role: USERS_ROLES.ADVISOR,
    })
    const service = new OrganizationsService()
    const list = await service.listAdvisors(org.id)
    assert.isAtLeast(list.length, 1)
    const found = list.find((a) => a.id === String(user.id))
    assert.isDefined(found)
    assert.equal(found!.email, 'advisor@test.com')
    assert.equal(found!.role, 'expert')
  })

  test('inviteAdvisor creates user and returns AdvisorDto', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Org Invite',
      slug: uniqueSlug(),
      logoUrl: null,
    })
    const service = new OrganizationsService()
    const dto = await service.inviteAdvisor({
      organizationId: org.id,
      name: 'New Advisor',
      email: 'new@advisor.com',
      role: 'expert',
    })
    assert.equal(dto.name, 'New Advisor')
    assert.equal(dto.email, 'new@advisor.com')
    assert.equal(dto.organizationId, String(org.id))
    assert.equal(dto.role, 'expert')
  })

  test('inviteAdvisor throws when email already exists in org', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Org Dupe',
      slug: uniqueSlug(),
      logoUrl: null,
    })
    await User.create({
      organizationId: org.id,
      email: 'existing@test.com',
      name: 'Existing',
      password: await hash.make('secret'),
      role: USERS_ROLES.ADVISOR,
    })
    const service = new OrganizationsService()
    try {
      await service.inviteAdvisor({
        organizationId: org.id,
        name: 'Other',
        email: 'existing@test.com',
        role: 'expert',
      })
      assert.fail('Expected inviteAdvisor to throw')
    } catch (err: any) {
      assert.include(err.message, 'déjà utilisé')
    }
  })
})
