import PdfExportsController from '#controllers/pdf_exports_controller'
import Employee from '#models/employee'
import Organization from '#models/organization'
import PdfExport from '#models/pdf_export'
import User from '#models/user'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

function makeCtx(overrides: any = {}) {
  return {
    request: overrides.request ?? { qs: () => ({}) },
    inertia: {
      rendered: null as any,
      render(name: string, props: any) {
        this.rendered = { name, props }
        return this.rendered
      },
    },
    auth: overrides.auth ?? { user: null },
    ...overrides,
  } as any
}

async function seedOrgWithAdvisorAndEmployee(prefix: string) {
  const org = await Organization.create({
    name: `${prefix} Org`,
    slug: `${prefix}-${Date.now()}`,
    logoUrl: null,
  })
  const talent = await User.create({
    organizationId: org.id,
    email: `${prefix}-talent-${Date.now()}@example.com`,
    password: 'secretsecret',
    name: 'Talent',
    role: USERS_ROLES.EMPLOYEE as any,
  })
  const employee = await Employee.create({
    organizationId: org.id,
    advisorId: null,
    userId: talent.id,
    name: 'Emp',
    email: `${prefix}-emp-${Date.now()}@example.com`,
    currentRole: 'Dev',
    targetRole: null,
    summary: null,
    advisorNotes: null,
    status: 'active',
    onboarded: true,
  })
  const admin = await User.create({
    organizationId: org.id,
    email: `${prefix}-admin-${Date.now()}@example.com`,
    password: 'secretsecret',
    name: 'Admin',
    role: USERS_ROLES.ADMIN as any,
  })
  return { org, employee, admin }
}

test.group('PdfExportsController.index', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('admin only sees pdf exports for their organization', async ({ assert }) => {
    const a = await seedOrgWithAdvisorAndEmployee('a')
    const b = await seedOrgWithAdvisorAndEmployee('b')

    const exportA = await PdfExport.create({
      userId: a.admin.id,
      organizationId: a.org.id,
      employeeId: a.employee.id,
      advisorUserId: null,
      status: PDF_EXPORT_STATUSES.PENDING,
    })

    await PdfExport.create({
      userId: b.admin.id,
      organizationId: b.org.id,
      employeeId: b.employee.id,
      advisorUserId: null,
      status: PDF_EXPORT_STATUSES.PENDING,
    })

    const controller = new PdfExportsController()
    const ctx = makeCtx({
      auth: {
        user: {
          id: a.admin.id,
          organizationId: a.org.id,
          role: USERS_ROLES.ADMIN,
        },
      },
    })

    // @ts-expect-error minimal context
    await controller.index(ctx)

    const rendered = ctx.inertia.rendered
    assert.equal(rendered.name, 'dashboard/admin/jobs/Index')
    const exports = rendered.props.exports as { id: number }[]
    assert.lengthOf(exports, 1)
    assert.equal(exports[0].id, exportA.id)
  })

  test('super admin sees exports from all organizations', async ({ assert }) => {
    const a = await seedOrgWithAdvisorAndEmployee('sa-a')
    const b = await seedOrgWithAdvisorAndEmployee('sa-b')

    await PdfExport.create({
      userId: a.admin.id,
      organizationId: a.org.id,
      employeeId: a.employee.id,
      advisorUserId: null,
      status: PDF_EXPORT_STATUSES.PROCESSING,
    })
    await PdfExport.create({
      userId: b.admin.id,
      organizationId: b.org.id,
      employeeId: b.employee.id,
      advisorUserId: null,
      status: PDF_EXPORT_STATUSES.PENDING,
    })

    const controller = new PdfExportsController()
    const ctx = makeCtx({
      auth: {
        user: {
          id: 999,
          organizationId: a.org.id,
          role: USERS_ROLES.SUPER_ADMIN,
        },
      },
    })

    // @ts-expect-error minimal context
    await controller.index(ctx)

    const exports = ctx.inertia.rendered.props.exports as unknown[]
    assert.isAtLeast(exports.length, 2)
  })

  test('filtre ?status=completed ne retourne que les exports complétés', async ({ assert }) => {
    const { org, employee, admin } = await seedOrgWithAdvisorAndEmployee('filter-completed')

    const exportCompleted = await PdfExport.create({
      userId: admin.id,
      organizationId: org.id,
      employeeId: employee.id,
      advisorUserId: null,
      status: PDF_EXPORT_STATUSES.COMPLETED,
      filePath: '/tmp/test.pdf',
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
      size: 100,
    })

    // Export pending dans la même orga — ne doit pas apparaître
    await PdfExport.create({
      userId: admin.id,
      organizationId: org.id,
      employeeId: employee.id,
      advisorUserId: null,
      status: PDF_EXPORT_STATUSES.PENDING,
    })

    const controller = new PdfExportsController()
    const ctx = makeCtx({
      auth: { user: { id: admin.id, organizationId: org.id, role: USERS_ROLES.ADMIN } },
      request: { qs: () => ({ status: 'completed' }) },
    })

    // @ts-expect-error minimal context
    await controller.index(ctx)

    const exports = ctx.inertia.rendered.props.exports as { id: number; status: string }[]
    assert.isTrue(exports.every((e) => e.status === PDF_EXPORT_STATUSES.COMPLETED))
    assert.isTrue(exports.some((e) => e.id === exportCompleted.id))
  })

  test("une valeur de statut invalide n'applique aucun filtre", async ({ assert }) => {
    const { org, employee, admin } = await seedOrgWithAdvisorAndEmployee('filter-invalid')

    await PdfExport.create({
      userId: admin.id,
      organizationId: org.id,
      employeeId: employee.id,
      advisorUserId: null,
      status: PDF_EXPORT_STATUSES.PENDING,
    })
    await PdfExport.create({
      userId: admin.id,
      organizationId: org.id,
      employeeId: employee.id,
      advisorUserId: null,
      status: PDF_EXPORT_STATUSES.COMPLETED,
      filePath: '/tmp/x.pdf',
      fileName: 'x.pdf',
      mimeType: 'application/pdf',
      size: 10,
    })

    const controller = new PdfExportsController()
    const ctx = makeCtx({
      auth: { user: { id: admin.id, organizationId: org.id, role: USERS_ROLES.ADMIN } },
      request: { qs: () => ({ status: 'not_a_real_status' }) },
    })

    // @ts-expect-error minimal context
    await controller.index(ctx)

    // Les deux exports doivent être retournés (pas de filtre appliqué)
    const exports = ctx.inertia.rendered.props.exports as { id: number }[]
    assert.isAtLeast(exports.length, 2)
  })

  test('retourne sans render si utilisateur non authentifié', async ({ assert }) => {
    const controller = new PdfExportsController()
    const ctx = makeCtx({ auth: { user: null } })

    // @ts-expect-error minimal context
    const result = await controller.index(ctx)

    // Guard `if (!user) return` — inertia.render ne doit pas avoir été appelé
    assert.isNull(ctx.inertia.rendered)
    assert.isUndefined(result)
  })
})
