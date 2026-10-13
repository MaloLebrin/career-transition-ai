import { makeEntitlements } from '#tests/support/entitlements'
import Employee from '#models/employee'
import EmployeeSynthesis, { EMPLOYEE_SYNTHESIS_SHARE_STATUSES } from '#models/employee_synthesis'
import Organization from '#models/organization'
import PdfExport from '#models/pdf_export'
import { EmployeeSynthesisFactory } from '#database/factories/employee_synthesis_factory'
import { PdfExportFactory } from '#database/factories/pdf_export_factory'
import { EmployeeSynthesisService } from '#services/employee_synthesis_service'
import { EntitlementsService } from '#services/entitlements_service'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import { PdfExportNotFailedError, PdfExportNotFoundError } from '#exceptions/pdf_export_errors'
import {
  createAdvisor,
  createB2cCandidate,
  createCandidate,
  createEmployeeFor,
} from '#tests/support/actors'
import { restoreCloudinary, swapFakeCloudinary } from '#tests/support/fake_cloudinary'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('EmployeeSynthesisService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('buildForCandidate never exposes internal notes', async ({ assert }) => {
    const service = new EmployeeSynthesisService()
    const org = await Organization.create({
      name: 'Synth Org',
      slug: `synth-org-${Date.now()}`,
      logoUrl: null,
    })

    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: null,
      userId: null,
      name: 'Candidate',
      email: 'candidate@example.com',
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: null,
      advisorNotes: null,
      status: 'active',
      onboarded: true,
    })

    await EmployeeSynthesis.create({
      organizationId: org.id,
      employeeId: employee.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
      sharedAt: null,
      sharedByUserId: null,
      expertCommentsShared: 'Visible',
      expertNotesInternal: 'SECRET',
      executiveSummaryOverride: null,
    })

    const payload = await service.buildForCandidate({
      organizationId: org.id,
      employeeId: employee.id,
    })

    assert.equal(payload.synthesis.expertCommentsShared, 'Visible')
    assert.isUndefined((payload.synthesis as any).expertNotesInternal)
  })
})

test.group('EmployeeSynthesisService — visibilité candidat et exports (#101)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  const service = new EmployeeSynthesisService()
  const entitlements = makeEntitlements()

  test('candidateCanView : B2B selon le partage, B2C selon le forfait', async ({ assert }) => {
    const b2b = await createCandidate()
    const b2bEntitlement = await entitlements.forEmployee(b2b.employee)
    assert.isFalse(service.candidateCanView(b2b.employee, null, b2bEntitlement))
    const draft = await EmployeeSynthesisFactory.merge({
      organizationId: b2b.employee.organizationId,
      employeeId: b2b.employee.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.DRAFT,
    }).create()
    assert.isFalse(service.candidateCanView(b2b.employee, draft, b2bEntitlement))
    draft.shareStatus = EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED
    assert.isTrue(service.candidateCanView(b2b.employee, draft, b2bEntitlement))

    const unpaid = await createB2cCandidate()
    const shared = await EmployeeSynthesisFactory.merge({
      organizationId: unpaid.employee.organizationId,
      employeeId: unpaid.employee.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
    }).create()
    assert.isFalse(
      service.candidateCanView(
        unpaid.employee,
        shared,
        await entitlements.forEmployee(unpaid.employee)
      )
    )

    const paid = await createB2cCandidate({ paid: true })
    assert.isTrue(
      service.candidateCanView(paid.employee, null, await entitlements.forEmployee(paid.employee))
    )
  })

  test('getCandidateEmployee et findRow : fiche du connecté, ligne sans création', async ({
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    const found = await service.getCandidateEmployee(user)
    assert.equal(found.id, employee.id)
    const scope = { organizationId: employee.organizationId, employeeId: employee.id }
    assert.isNull(await service.findRow(scope))
    await service.getOrCreateRow(scope)
    assert.isNotNull(await service.findRow(scope))
    const advisor = await createAdvisor()
    await assert.rejects(() => service.getCandidateEmployee(advisor))
  })

  test('findLatestPdfExport : le plus récent dans la portée, lien seulement si terminé', async ({
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    const other = await createCandidate()
    await PdfExportFactory.merge({
      userId: user.id,
      organizationId: employee.organizationId,
      employeeId: employee.id,
      status: PDF_EXPORT_STATUSES.FAILED,
    }).create()
    const latest = await PdfExportFactory.merge({
      userId: user.id,
      organizationId: employee.organizationId,
      employeeId: employee.id,
      status: PDF_EXPORT_STATUSES.COMPLETED,
      filePath: 'exports/1/2.pdf',
    }).create()
    await PdfExportFactory.merge({
      userId: other.user.id,
      organizationId: other.employee.organizationId,
      employeeId: other.employee.id,
      status: PDF_EXPORT_STATUSES.COMPLETED,
      filePath: 'exports/9/9.pdf',
    }).create()

    const byUser = await service.findLatestPdfExport({ userId: user.id }, employee.id)
    assert.equal(byUser?.id, latest.id)
    assert.equal(byUser?.downloadUrl, `/dashboard/pdf-exports/${latest.id}/download`)
    const byOrg = await service.findLatestPdfExport(
      { organizationId: employee.organizationId },
      employee.id
    )
    assert.equal(byOrg?.id, latest.id)
    assert.isNull(await service.findLatestPdfExport({ userId: other.user.id }, employee.id))
    latest.status = PDF_EXPORT_STATUSES.PROCESSING
    await latest.save()
    const pending = await service.findLatestPdfExport({ userId: user.id }, employee.id)
    assert.isNull(pending?.downloadUrl)
  })

  test('requestPdfExport : crée l’export puis lance le job (queue sync)', async ({
    assert,
    cleanup,
  }) => {
    swapFakeCloudinary()
    cleanup(() => restoreCloudinary())
    const advisor = await createAdvisor()
    const { user, employee } = await createCandidate({ advisor })

    const created = await service.requestPdfExport({ user, employee, advisorUserId: advisor.id })

    const stored = await PdfExport.findOrFail(created.id)
    assert.equal(stored.userId, user.id)
    assert.equal(stored.advisorUserId, advisor.id)
    assert.equal(stored.status, PDF_EXPORT_STATUSES.COMPLETED)
  })
})

test.group('EmployeeSynthesisService — exports en échec (#72)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  const service = new EmployeeSynthesisService()

  async function failedExport() {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    await EmployeeSynthesisFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
    }).create()
    const pdf = await PdfExportFactory.merge({
      userId: advisor.id,
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      status: PDF_EXPORT_STATUSES.FAILED,
      errorMessage: 'Boom',
      filePath: null,
    }).create()
    return { advisor, employee, pdf }
  }

  test('retryFailedPdfExport : relance la même ligne (job sync en test) sans erreur', async ({
    assert,
  }) => {
    const { advisor, employee, pdf } = await failedExport()

    await service.retryFailedPdfExport(advisor, employee.id, pdf.id)

    await pdf.refresh()
    assert.equal(pdf.status, PDF_EXPORT_STATUSES.COMPLETED)
    assert.isNull(pdf.errorMessage)
  })

  test('deleteFailedPdfExport : supprime la ligne', async ({ assert }) => {
    const { advisor, employee, pdf } = await failedExport()

    await service.deleteFailedPdfExport(advisor, employee.id, pdf.id)

    assert.isNull(await PdfExport.find(pdf.id))
  })

  test('refuse un export qui n’est pas en échec, inconnu ou d’un autre candidat', async ({
    assert,
  }) => {
    const { advisor, employee, pdf } = await failedExport()
    await pdf.merge({ status: PDF_EXPORT_STATUSES.COMPLETED }).save()
    const other = await createEmployeeFor(advisor)

    await assert.rejects(
      () => service.retryFailedPdfExport(advisor, employee.id, pdf.id),
      PdfExportNotFailedError
    )
    await assert.rejects(
      () => service.deleteFailedPdfExport(advisor, employee.id, pdf.id),
      PdfExportNotFailedError
    )
    await assert.rejects(
      () => service.deleteFailedPdfExport(advisor, employee.id, 999999),
      PdfExportNotFoundError
    )
    await assert.rejects(
      () => service.deleteFailedPdfExport(advisor, other.id, pdf.id),
      PdfExportNotFoundError
    )
    await assert.rejects(
      () => service.retryFailedPdfExport(advisor, 999999, pdf.id),
      PdfExportNotFoundError
    )
  })
})
