import { EmployeeFactory } from '#database/factories/employee_factory'
import Organization from '#models/organization'
import User from '#models/user'
import { LIST_PAGE_SIZE } from '#shared/constants/pagination'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { createAdmin, createAdvisor, createSuperAdmin } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Listes paginées et filtrées côté serveur (#75), de la query string à la page Inertia :
 * `?page=&search=&status=|minEmployees=|role=`, méta `pagination` et écho des `filters`.
 */
const EMPLOYEES = '/dashboard/conseiller/employees'
const ORGANIZATIONS = '/dashboard/super-admin/organizations'
const USERS = '/dashboard/super-admin/users'

test.group('Liste des candidats (#75)', (group) => {
  group.each.setup(() => truncateDb())

  test('pagine, trie par nom et renvoie la méta et les filtres', async ({ client, assert }) => {
    const admin = await createAdmin()
    for (let i = 0; i < LIST_PAGE_SIZE + 2; i++) {
      await EmployeeFactory.merge({
        organizationId: admin.organizationId,
        name: `Candidat ${String(i).padStart(3, '0')}`,
      }).create()
    }

    const first = await client.get(EMPLOYEES).loginAs(admin).withInertia()
    const firstProps = assertPage(assert, first, 'dashboard/conseiller/employees/List', [
      'employees',
      'pagination',
      'filters',
    ])
    const second = await client.get(`${EMPLOYEES}?page=2`).loginAs(admin).withInertia()
    const secondProps = assertPage(assert, second, 'dashboard/conseiller/employees/List')

    assert.lengthOf(firstProps.employees as unknown[], LIST_PAGE_SIZE)
    assert.lengthOf(secondProps.employees as unknown[], 2)
    assert.deepEqual(firstProps.pagination, {
      page: 1,
      pageSize: LIST_PAGE_SIZE,
      total: LIST_PAGE_SIZE + 2,
      lastPage: 2,
    })
    assert.deepEqual(firstProps.filters, { search: '', status: 'all' })
  })

  test('recherche et statut côté serveur ; entrées invalides ignorées', async ({
    client,
    assert,
  }) => {
    const admin = await createAdmin()
    await EmployeeFactory.merge({
      organizationId: admin.organizationId,
      name: 'Jean Dupont',
      status: 'active',
    }).create()
    await EmployeeFactory.merge({
      organizationId: admin.organizationId,
      name: 'Marie Bernard',
      status: 'completed',
    }).create()

    const bySearch = await client.get(`${EMPLOYEES}?search=JEAN`).loginAs(admin).withInertia()
    const byStatus = await client.get(`${EMPLOYEES}?status=completed`).loginAs(admin).withInertia()
    const invalid = await client
      .get(`${EMPLOYEES}?page=abc&status=bogus&search[]=x`)
      .loginAs(admin)
      .withInertia()

    const names = (response: typeof bySearch) =>
      (
        assertPage(assert, response, 'dashboard/conseiller/employees/List').employees as Array<{
          name: string
        }>
      ).map((e) => e.name)
    assert.deepEqual(names(bySearch), ['Jean Dupont'])
    assert.deepEqual(names(byStatus), ['Marie Bernard'])
    assert.deepEqual(names(invalid), ['Jean Dupont', 'Marie Bernard'])
    assert.deepEqual(assertPage(assert, byStatus, 'dashboard/conseiller/employees/List').filters, {
      search: '',
      status: 'completed',
    })
  })

  test("un conseiller ne retrouve pas par la recherche un candidat d'un autre conseiller", async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const other = await createAdvisor(await Organization.findOrFail(advisor.organizationId))
    await EmployeeFactory.merge({
      organizationId: advisor.organizationId,
      advisorId: other.id,
      name: 'Secret Dupont',
    }).create()

    const response = await client.get(`${EMPLOYEES}?search=secret`).loginAs(advisor).withInertia()

    const props = assertPage(assert, response, 'dashboard/conseiller/employees/List')
    assert.lengthOf(props.employees as unknown[], 0)
  })
})

test.group('Listes super admin (#75)', (group) => {
  group.each.setup(() => truncateDb())

  test('organisations : recherche, seuil de candidats et méta', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    const alpha = await Organization.create({ name: 'Alpha Conseil', slug: 'alpha' })
    const beta = await Organization.create({ name: 'Beta RH', slug: 'beta' })
    await EmployeeFactory.merge({ organizationId: alpha.id }).createMany(3)

    const search = await client
      .get(`${ORGANIZATIONS}?search=beta`)
      .loginAs(superAdmin)
      .withInertia()
    const min = await client
      .get(`${ORGANIZATIONS}?minEmployees=2`)
      .loginAs(superAdmin)
      .withInertia()

    const searchProps = assertPage(assert, search, 'dashboard/admin/organizations/Index', [
      'pagination',
      'filters',
    ])
    const minProps = assertPage(assert, min, 'dashboard/admin/organizations/Index')
    assert.deepEqual(
      (searchProps.organizations as Array<{ id: number }>).map((o) => o.id),
      [beta.id]
    )
    assert.deepEqual(searchProps.filters, { search: 'beta', minEmployees: '' })
    assert.deepEqual(
      (minProps.organizations as Array<{ id: number }>).map((o) => o.id),
      [alpha.id]
    )
    assert.deepEqual(minProps.filters, { search: '', minEmployees: 2 })
    assert.equal((minProps.pagination as { total: number }).total, 1)
  })

  test('utilisateurs : recherche par cabinet, filtre de rôle et méta', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const org = await Organization.create({ name: 'Cabinet Horizon', slug: 'horizon' })
    const advisor = await User.create({
      organizationId: org.id,
      email: 'alice@horizon.test',
      name: 'Alice',
      password: 'secret-password',
      role: USERS_ROLES.ADVISOR,
    })
    await User.create({
      organizationId: org.id,
      email: 'bob@horizon.test',
      name: 'Bob',
      password: 'secret-password',
      role: USERS_ROLES.ADMIN,
    })

    const byOrg = await client.get(`${USERS}?search=horizon`).loginAs(superAdmin).withInertia()
    const byRole = await client
      .get(`${USERS}?search=horizon&role=advisor`)
      .loginAs(superAdmin)
      .withInertia()

    const orgProps = assertPage(assert, byOrg, 'dashboard/admin/users/Index', [
      'users',
      'organizations',
      'pagination',
      'filters',
    ])
    const roleProps = assertPage(assert, byRole, 'dashboard/admin/users/Index')
    assert.lengthOf(orgProps.users as unknown[], 2)
    assert.deepEqual(
      (roleProps.users as Array<{ id: number }>).map((u) => u.id),
      [advisor.id]
    )
    assert.deepEqual(roleProps.filters, { search: 'horizon', role: 'advisor' })
  })
})
