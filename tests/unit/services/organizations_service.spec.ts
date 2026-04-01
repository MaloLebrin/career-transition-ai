import Organization from '#models/organization'
import User from '#models/user'
import { OrganizationsService } from '#services/organizations_service'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

function uniqueSlug() {
  return `org-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

test.group('OrganizationsService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  test('getById returns OrganizationDto when org exists', async ({ assert }) => {
    const service = new OrganizationsService()
    const org = await Organization.create({
      name: 'Test Org',
      slug: uniqueSlug(),
      logoUrl: null,
    })
    const dto = await service.getById(org.id)
    assert.isNotNull(dto)
    assert.equal(dto!.id, org.id)
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
    const found = list.find((a) => a.id === user.id)
    assert.isDefined(found)
    assert.equal(found!.email, 'advisor@test.com')
    assert.equal(found!.role, 'expert')
  })
})
