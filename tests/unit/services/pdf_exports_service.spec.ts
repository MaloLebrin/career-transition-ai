import { EmployeeFactory } from '#database/factories/employee_factory'
import { UserFactory } from '#database/factories/user_factory'
import { PdfExportFactory } from '#database/factories/pdf_export_factory'
import type Employee from '#models/employee'
import type User from '#models/user'
import { PdfExportsService } from '#services/pdf_exports_service'
import { PDF_EXPORT_STATUSES, type PdfExportStatus } from '#shared/constants/pdf_export'
import {
  createAdmin,
  createAdvisor,
  createB2cCandidate,
  createInHouseExpert,
  createSuperAdmin,
} from '#tests/support/actors'
import { LIST_PAGE_SIZE } from '#shared/constants/pagination'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const service = new PdfExportsService()

async function exportOf(
  employee: Employee,
  status: PdfExportStatus = PDF_EXPORT_STATUSES.COMPLETED
) {
  const requester = await UserFactory.merge({ organizationId: employee.organizationId }).create()
  return PdfExportFactory.merge({
    userId: requester.id,
    organizationId: employee.organizationId,
    employeeId: employee.id,
    status,
  }).create()
}

async function ids(user: User, status?: string) {
  const { items } = await service.listForUser(user, { status })
  return items.map((row) => row.id)
}

test.group('PdfExportsService.listForUser', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('un conseiller ne voit que les exports de son organisation', async ({ assert }) => {
    const advisor = await createAdvisor()
    const mine = await exportOf(
      await EmployeeFactory.merge({ organizationId: advisor.organizationId }).create()
    )
    const other = await createAdvisor()
    await exportOf(await EmployeeFactory.merge({ organizationId: other.organizationId }).create())

    assert.deepEqual(await ids(advisor), [mine.id])
  })

  test('expert : export d’un B2C non assigné masqué, assigné visible', async ({ assert }) => {
    const expert = await createInHouseExpert()
    const { employee: assigned } = await createB2cCandidate({ expert })
    const { employee: unassigned } = await createB2cCandidate()
    const visible = await exportOf(assigned)
    await exportOf(unassigned)

    assert.deepEqual(await ids(expert), [visible.id])
  })

  test('le super admin voit tout ; filtre de statut valide, inconnu ignoré', async ({ assert }) => {
    const superAdmin = await createSuperAdmin()
    const admin = await createAdmin()
    const a = await exportOf(
      await EmployeeFactory.merge({ organizationId: admin.organizationId }).create(),
      PDF_EXPORT_STATUSES.FAILED
    )
    const { employee } = await createB2cCandidate()
    const b = await exportOf(employee, PDF_EXPORT_STATUSES.PENDING)

    assert.sameMembers(await ids(superAdmin), [a.id, b.id])
    assert.deepEqual(await ids(superAdmin, PDF_EXPORT_STATUSES.FAILED), [a.id])
    assert.sameMembers(await ids(superAdmin, 'bogus'), [a.id, b.id])
  })

  test('pagine, les plus récents d’abord, et expose la méta', async ({ assert }) => {
    const admin = await createAdmin()
    const employee = await EmployeeFactory.merge({ organizationId: admin.organizationId }).create()
    // Un seul demandeur : `exportOf` en crée un (mot de passe haché) par export.
    const requester = await UserFactory.merge({ organizationId: employee.organizationId }).create()
    const created: number[] = []
    for (let i = 0; i < LIST_PAGE_SIZE + 3; i++) {
      const row = await PdfExportFactory.merge({
        userId: requester.id,
        organizationId: employee.organizationId,
        employeeId: employee.id,
        status: PDF_EXPORT_STATUSES.COMPLETED,
      }).create()
      created.push(row.id)
    }

    const first = await service.listForUser(admin)
    const second = await service.listForUser(admin, { page: 2 })

    assert.lengthOf(first.items, LIST_PAGE_SIZE)
    assert.lengthOf(second.items, 3)
    assert.equal(first.items[0].id, created[created.length - 1])
    assert.deepEqual(first.pagination, {
      page: 1,
      pageSize: LIST_PAGE_SIZE,
      total: LIST_PAGE_SIZE + 3,
      lastPage: 2,
    })
  })
})
