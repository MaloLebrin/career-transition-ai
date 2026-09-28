import { PdfExportFactory } from '#database/factories/pdf_export_factory'
import { PdfExportNotFoundError, PdfExportNotReadyError } from '#exceptions/pdf_export_errors'
import type Employee from '#models/employee'
import type User from '#models/user'
import { PdfExportDownloadsService } from '#services/pdf_export_downloads_service'
import { pdfExportKey, storePdf } from '#services/pdf_storage_service'
import { PDF_EXPORT_STATUSES, type PdfExportStatus } from '#shared/constants/pdf_export'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { restoreCloudinary, swapFakeCloudinary } from '#tests/support/fake_cloudinary'
import {
  createAdmin,
  createAdvisor,
  createCandidate,
  createOrganization,
  createSuperAdmin,
  createUser,
} from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import type { Readable } from 'node:stream'

const service = new PdfExportDownloadsService()

async function drain(stream: Readable): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString()
}

/** Export du candidat `employee`, demandé par `requester` ; PDF déposé s'il est terminé. */
async function exportOf(
  employee: Employee,
  requester: User,
  status: PdfExportStatus = PDF_EXPORT_STATUSES.COMPLETED
) {
  const pdfExport = await PdfExportFactory.merge({
    userId: requester.id,
    organizationId: employee.organizationId,
    employeeId: employee.id,
    status,
    filePath: null,
    fileName: 'Synthèse_Élise.pdf',
    mimeType: 'application/pdf',
  }).create()
  if (status === PDF_EXPORT_STATUSES.COMPLETED) {
    const key = pdfExportKey(employee.organizationId, pdfExport.id)
    await storePdf(key, new TextEncoder().encode('%PDF-1.4 fake'))
    pdfExport.filePath = key
    await pdfExport.save()
  }
  return pdfExport
}

test.group('PdfExportDownloadsService.findFor — portée', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  test('conseiller, expert et admin lisent les exports de leur organisation', async ({
    assert,
  }) => {
    const org = await createOrganization()
    const advisor = await createAdvisor(org)
    const { employee } = await createCandidate({ organization: org })
    const pdfExport = await exportOf(employee, advisor)

    for (const user of [
      advisor,
      await createAdmin(org),
      await createUser(USERS_ROLES.EXPERT, org),
    ]) {
      const found = await service.findFor(user, pdfExport.id)
      assert.equal(found.id, pdfExport.id, user.role)
    }
  })

  /** Régression #63 : un export d'une autre organisation renvoyait 403 (existence révélée). */
  test('export d’une autre organisation : introuvable (404), pas interdit', async ({ assert }) => {
    const org = await createOrganization()
    const owner = await createAdvisor(org)
    const { employee } = await createCandidate({ organization: org })
    const pdfExport = await exportOf(employee, owner)

    for (const intruder of [
      await createAdmin(),
      await createAdvisor(),
      await createUser(USERS_ROLES.EXPERT),
    ]) {
      await assert.rejects(
        () => service.findFor(intruder, pdfExport.id),
        PdfExportNotFoundError as any
      )
    }
  })

  test('super admin : tous les exports', async ({ assert }) => {
    const org = await createOrganization()
    const advisor = await createAdvisor(org)
    const { employee } = await createCandidate({ organization: org })
    const pdfExport = await exportOf(employee, advisor)

    const found = await service.findFor(await createSuperAdmin(), pdfExport.id)

    assert.equal(found.id, pdfExport.id)
  })

  test('candidat : ses exports et ceux de sa fiche, jamais ceux d’un autre candidat', async ({
    assert,
  }) => {
    const org = await createOrganization()
    const advisor = await createAdvisor(org)
    const me = await createCandidate({ organization: org })
    const other = await createCandidate({ organization: org })

    const requestedByMe = await exportOf(me.employee, me.user)
    const byAdvisorForMe = await exportOf(me.employee, advisor)
    const forOther = await exportOf(other.employee, advisor)

    const ownRequest = await service.findFor(me.user, requestedByMe.id)
    const forMyFile = await service.findFor(me.user, byAdvisorForMe.id)

    assert.equal(ownRequest.id, requestedByMe.id)
    assert.equal(forMyFile.id, byAdvisorForMe.id)
    await assert.rejects(() => service.findFor(me.user, forOther.id), PdfExportNotFoundError as any)
  })

  test('export inexistant : 404', async ({ assert }) => {
    await assert.rejects(
      async () => service.findFor(await createAdmin(), 999_999),
      PdfExportNotFoundError as any
    )
  })
})

test.group('PdfExportDownloadsService.open — fichier', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  test('relaie le PDF avec son nom et son type', async ({ assert }) => {
    const org = await createOrganization()
    const advisor = await createAdvisor(org)
    const { employee } = await createCandidate({ organization: org })
    const pdfExport = await exportOf(employee, advisor)

    const file = await service.open(advisor, pdfExport.id)

    assert.equal(await drain(file.stream), '%PDF-1.4 fake')
    assert.equal(file.fileName, 'Synthèse_Élise.pdf')
    assert.equal(file.mimeType, 'application/pdf')
  })

  test('export pas encore terminé : 409, après le contrôle d’accès', async ({ assert }) => {
    const org = await createOrganization()
    const advisor = await createAdvisor(org)
    const { employee } = await createCandidate({ organization: org })

    for (const status of [PDF_EXPORT_STATUSES.PENDING, PDF_EXPORT_STATUSES.FAILED]) {
      const pdfExport = await exportOf(employee, advisor, status)
      await assert.rejects(() => service.open(advisor, pdfExport.id), PdfExportNotReadyError as any)
      // Hors organisation, le statut n'est jamais révélé : 404.
      await assert.rejects(
        async () => service.open(await createAdmin(), pdfExport.id),
        PdfExportNotFoundError as any
      )
    }
  })

  test('fichier absent du stockage ou chemin hors préfixe : 404', async ({ assert }) => {
    const org = await createOrganization()
    const advisor = await createAdvisor(org)
    const { employee } = await createCandidate({ organization: org })

    for (const filePath of [null, 'exports/inconnu.pdf', '/tmp/ancien_chemin.pdf']) {
      const pdfExport = await exportOf(employee, advisor, PDF_EXPORT_STATUSES.PENDING)
      pdfExport.merge({ status: PDF_EXPORT_STATUSES.COMPLETED, filePath })
      await pdfExport.save()

      await assert.rejects(() => service.open(advisor, pdfExport.id), PdfExportNotFoundError as any)
    }
  })
})
