import { EmployeeFactory } from '#database/factories/employee_factory'
import { PdfExportFactory } from '#database/factories/pdf_export_factory'
import type User from '#models/user'
import { PDF_EXPORT_STATUSES, type PdfExportStatus } from '#shared/constants/pdf_export'
import { createAdmin, createAdvisor, createSuperAdmin } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Suivi des exports PDF :
 * - GET /dashboard/conseiller/pdf-exports   (scopé à l'organisation)
 * - GET /dashboard/super-admin/pdf-exports  (toutes organisations)
 */
type ExportItem = { id: number; employeeName: string | null; downloadUrl: string | null }

async function exportFor(user: User, status: PdfExportStatus, employeeName = 'Candidat') {
  const employee = await EmployeeFactory.merge({
    organizationId: user.organizationId,
    name: employeeName,
  }).create()
  return PdfExportFactory.merge({
    userId: user.id,
    organizationId: user.organizationId,
    employeeId: employee.id,
    status,
    filePath: status === PDF_EXPORT_STATUSES.COMPLETED ? '/tmp/x.pdf' : null,
  }).create()
}

test.group('Exports PDF — liste', (group) => {
  group.each.setup(() => truncateDb())

  test('un conseiller ne voit que les exports de son organisation', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const mine = await exportFor(advisor, PDF_EXPORT_STATUSES.COMPLETED, 'Alice')
    await exportFor(await createAdvisor(), PDF_EXPORT_STATUSES.COMPLETED)

    const response = await client
      .get('/dashboard/conseiller/pdf-exports')
      .loginAs(advisor)
      .withInertia()

    const props = assertPage(assert, response, 'dashboard/admin/jobs/Index', ['exports'])
    const items = props.exports as ExportItem[]
    assert.deepEqual(
      items.map((e) => e.id),
      [mine.id]
    )
    assert.equal(items[0].employeeName, 'Alice')
    assert.equal(items[0].downloadUrl, `/dashboard/pdf-exports/${mine.id}/download`)
  })

  test('filtre par statut valide et ignore un statut inconnu', async ({ client, assert }) => {
    const admin = await createAdmin()
    const failed = await exportFor(admin, PDF_EXPORT_STATUSES.FAILED)
    const pending = await exportFor(admin, PDF_EXPORT_STATUSES.PENDING)

    const filtered = await client
      .get('/dashboard/conseiller/pdf-exports')
      .qs({ status: PDF_EXPORT_STATUSES.FAILED })
      .loginAs(admin)
      .withInertia()
    const filteredProps = assertPage(assert, filtered, 'dashboard/admin/jobs/Index')
    assert.deepEqual(
      (filteredProps.exports as ExportItem[]).map((e) => e.id),
      [failed.id]
    )
    assert.isNull((filteredProps.exports as ExportItem[])[0].downloadUrl)

    const unknown = await client
      .get('/dashboard/conseiller/pdf-exports')
      .qs({ status: 'bogus' })
      .loginAs(admin)
      .withInertia()
    const unknownProps = assertPage(assert, unknown, 'dashboard/admin/jobs/Index')
    assert.sameMembers(
      (unknownProps.exports as ExportItem[]).map((e) => e.id),
      [failed.id, pending.id]
    )
  })

  test('le super admin voit les exports de toutes les organisations', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const a = await exportFor(await createAdvisor(), PDF_EXPORT_STATUSES.PENDING)
    const b = await exportFor(await createAdvisor(), PDF_EXPORT_STATUSES.PROCESSING)

    const response = await client
      .get('/dashboard/super-admin/pdf-exports')
      .loginAs(superAdmin)
      .withInertia()

    const props = assertPage(assert, response, 'dashboard/admin/jobs/Index', ['exports'])
    assert.sameMembers(
      (props.exports as ExportItem[]).map((e) => e.id),
      [a.id, b.id]
    )
  })

  test('un conseiller ne peut pas accéder à la vue super admin (403)', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client
      .get('/dashboard/super-admin/pdf-exports')
      .loginAs(advisor)
      .redirects(0)

    response.assertStatus(403)
  })
})
