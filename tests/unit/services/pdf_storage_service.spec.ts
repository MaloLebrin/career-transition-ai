import { PdfExportFactory } from '#database/factories/pdf_export_factory'
import PurgeExpiredPdfExportsJob from '#jobs/purge_expired_pdf_exports_job'
import PdfExport from '#models/pdf_export'
import {
  attachmentDisposition,
  deletePdf,
  isPdfExportKey,
  pdfExportKey,
  purgeExpiredPdfExports,
  readPdfStream,
  storePdf,
} from '#services/pdf_storage_service'
import { PDF_EXPORT_RETENTION_DAYS, PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import { createAdvisor, createEmployeeFor } from '#tests/support/actors'
import {
  type FakeCloudinary,
  restoreCloudinary,
  swapFakeCloudinary,
} from '#tests/support/fake_cloudinary'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import type { Readable } from 'node:stream'

/**
 * Stockage des exports PDF sur Cloudinary (issue #49, fake en mémoire) :
 * `public_id` sans donnée personnelle, fichier privé, lecture/suppression
 * limitées aux clés d'export, purge des exports expirés.
 */

const PDF = new TextEncoder().encode('%PDF-1.4 test')

async function readAll(stream: Readable): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString()
}

test.group('pdf_storage_service | clés et en-têtes', () => {
  test('la clé ne dépend que des ids, sous le dossier de l’organisation', ({ assert }) => {
    assert.equal(
      pdfExportKey(7, 42),
      'career-transition/dev/organizations/7/exports/pdf_export_42.pdf'
    )
    assert.isTrue(isPdfExportKey(pdfExportKey(7, 42)))
  })

  test('refuse les clés qui ne sont pas des exports', ({ assert }) => {
    // Ancienne clé relative du stockage Drive : traitée comme absente.
    assert.isFalse(isPdfExportKey('exports/pdf_export_42.pdf'))
    assert.isFalse(isPdfExportKey('/app/tmp/exports/Synthese.pdf'))
    assert.isFalse(isPdfExportKey('career-transition/dev/organizations/7/logo/logo.png'))
    assert.isFalse(
      isPdfExportKey('career-transition/dev/organizations/7/exports/../documents/cv.pdf')
    )
    assert.isFalse(
      isPdfExportKey('career-transition/production/organizations/7/exports/pdf_export_1.pdf')
    )
  })

  test('Content-Disposition : repli ASCII et nom UTF-8', ({ assert }) => {
    assert.equal(
      attachmentDisposition('Synthèse "Élise" (1).pdf'),
      `attachment; filename="Synthese _Elise_ (1).pdf"; filename*=UTF-8''Synth%C3%A8se%20%22%C3%89lise%22%20%281%29.pdf`
    )
  })
})

test.group('pdf_storage_service | stockage', (group) => {
  let cloud: FakeCloudinary
  group.each.setup(() => {
    cloud = swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  test('écrit un PDF privé, le relit puis le supprime', async ({ assert }) => {
    const key = pdfExportKey(1, 1)

    assert.equal(await storePdf(key, PDF), PDF.byteLength)
    assert.deepEqual(cloud.uploaded, [
      { publicId: key, resourceType: 'raw', deliveryType: 'authenticated' },
    ])

    const stream = await readPdfStream(key)
    assert.equal(await readAll(stream!), '%PDF-1.4 test')

    assert.isTrue(await deletePdf(key))
    assert.isFalse(cloud.has(key))
  })

  test('fichier absent : lecture null, suppression false', async ({ assert }) => {
    assert.isNull(await readPdfStream(pdfExportKey(1, 2)))
    assert.isFalse(await deletePdf(pdfExportKey(1, 2)))
  })

  test('ne lit ni ne supprime une clé qui n’est pas un export', async ({ assert }) => {
    const other = 'career-transition/dev/organizations/1/documents/cv.pdf'
    await cloud.uploadBuffer(PDF, {
      publicId: other,
      resourceType: 'raw',
      deliveryType: 'authenticated',
    })

    assert.isNull(await readPdfStream(other))
    assert.isFalse(await deletePdf(other))
    assert.isTrue(cloud.has(other))
    assert.lengthOf(cloud.downloaded, 0)
    assert.lengthOf(cloud.destroyed, 0)
  })
})

test.group('pdf_storage_service | purge des exports expirés', (group) => {
  let cloud: FakeCloudinary
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    cloud = swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  async function completedExport(finishedDaysAgo: number) {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const pdfExport = await PdfExportFactory.merge({
      userId: advisor.id,
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      status: PDF_EXPORT_STATUSES.COMPLETED,
      finishedAt: DateTime.now().minus({ days: finishedDaysAgo }),
    }).create()
    pdfExport.filePath = pdfExportKey(advisor.organizationId, pdfExport.id)
    await pdfExport.save()
    await storePdf(pdfExport.filePath, PDF)
    return pdfExport
  }

  test('supprime les PDF plus vieux que la limite et retire leur clé', async ({ assert }) => {
    const old = await completedExport(PDF_EXPORT_RETENTION_DAYS + 1)
    const recent = await completedExport(1)

    const purged = await purgeExpiredPdfExports(
      DateTime.now().minus({ days: PDF_EXPORT_RETENTION_DAYS })
    )

    assert.equal(purged, 1)
    assert.isFalse(cloud.has(pdfExportKey(old.organizationId!, old.id)))
    assert.isTrue(cloud.has(recent.filePath!))
    await old.refresh()
    assert.isNull(old.filePath)
    assert.equal(old.status, PDF_EXPORT_STATUSES.COMPLETED)
    await recent.refresh()
    assert.equal(recent.filePath, pdfExportKey(recent.organizationId!, recent.id))
  })

  test('le job applique la rétention par défaut', async ({ assert }) => {
    const old = await completedExport(PDF_EXPORT_RETENTION_DAYS + 5)
    const recent = await completedExport(PDF_EXPORT_RETENTION_DAYS - 5)

    await PurgeExpiredPdfExportsJob.dispatch({}).run()

    assert.isFalse(cloud.has(old.filePath!))
    assert.isTrue(cloud.has(recent.filePath!))
    const purged = await PdfExport.findOrFail(old.id)
    assert.isNull(purged.filePath)
  })

  test('le job accepte une rétention explicite', async ({ assert }) => {
    const pdfExport = await completedExport(3)

    await PurgeExpiredPdfExportsJob.dispatch({ retentionDays: 2 }).run()

    await pdfExport.refresh()
    assert.isNull(pdfExport.filePath)
  })
})
