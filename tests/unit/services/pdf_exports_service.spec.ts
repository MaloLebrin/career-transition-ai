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
  return (await service.listForUser(user, { status })).map((row) => row.id)
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
    const a = await exportOf(
      await EmployeeFactory.merge({
        organizationId: (await createAdmin()).organizationId,
      }).create(),
      PDF_EXPORT_STATUSES.FAILED
    )
    const { employee } = await createB2cCandidate()
    const b = await exportOf(employee, PDF_EXPORT_STATUSES.PENDING)

    assert.sameMembers(await ids(superAdmin), [a.id, b.id])
    assert.deepEqual(await ids(superAdmin, PDF_EXPORT_STATUSES.FAILED), [a.id])
    assert.sameMembers(await ids(superAdmin, 'bogus'), [a.id, b.id])
  })
})
