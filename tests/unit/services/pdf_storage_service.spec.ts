import { missingS3Env } from '#config/drive'
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
import testUtils from '@adonisjs/core/services/test_utils'
import drive from '@adonisjs/drive/services/main'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import type { Readable } from 'node:stream'

/**
 * Stockage des exports PDF sur le disque Drive (issue #21) : clé relative,
 * lecture/suppression limitées au préfixe `exports/`, purge des exports expirés.
 */

const PDF = new TextEncoder().encode('%PDF-1.4 test')

async function readAll(stream: Readable): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString()
}

test.group('pdf_storage_service | clés et en-têtes', () => {
  test('la clé est relative et ne dépend que de l’id', ({ assert }) => {
    assert.equal(pdfExportKey(42), 'exports/pdf_export_42.pdf')
    assert.isTrue(isPdfExportKey(pdfExportKey(42)))
  })

  test('refuse les clés hors du préfixe exports/', ({ assert }) => {
    assert.isFalse(isPdfExportKey('/app/tmp/exports/Synthese.pdf'))
    assert.isFalse(isPdfExportKey('secrets/cle.pem'))
    assert.isFalse(isPdfExportKey('exports/../secrets/cle.pem'))
  })

  test('Content-Disposition : repli ASCII et nom UTF-8', ({ assert }) => {
    assert.equal(
      attachmentDisposition('Synthèse "Élise" (1).pdf'),
      `attachment; filename="Synthese _Elise_ (1).pdf"; filename*=UTF-8''Synth%C3%A8se%20%22%C3%89lise%22%20%281%29.pdf`
    )
  })
})

test.group('pdf_storage_service | disque', (group) => {
  let disk: ReturnType<typeof drive.fake>
  group.each.setup(() => {
    disk = drive.fake()
    return () => drive.restore()
  })

  test('écrit, relit puis supprime un PDF', async ({ assert }) => {
    const key = pdfExportKey(1)

    assert.equal(await storePdf(key, PDF), PDF.byteLength)
    disk.assertExists(key)

    const stream = await readPdfStream(key)
    assert.equal(await readAll(stream!), '%PDF-1.4 test')

    assert.isTrue(await deletePdf(key))
    disk.assertMissing(key)
  })

  test('fichier absent : lecture null, suppression false', async ({ assert }) => {
    assert.isNull(await readPdfStream(pdfExportKey(2)))
    assert.isFalse(await deletePdf(pdfExportKey(2)))
  })

  test('ne lit ni ne supprime hors du préfixe', async ({ assert }) => {
    await disk.put('autre/fichier.pdf', 'x')

    assert.isNull(await readPdfStream('autre/fichier.pdf'))
    assert.isFalse(await deletePdf('autre/fichier.pdf'))
    disk.assertExists('autre/fichier.pdf')
  })
})

test.group('pdf_storage_service | purge des exports expirés', (group) => {
  let disk: ReturnType<typeof drive.fake>
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    disk = drive.fake()
    return () => drive.restore()
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
    pdfExport.filePath = pdfExportKey(pdfExport.id)
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
    disk.assertMissing(pdfExportKey(old.id))
    disk.assertExists(recent.filePath!)
    await old.refresh()
    assert.isNull(old.filePath)
    assert.equal(old.status, PDF_EXPORT_STATUSES.COMPLETED)
    await recent.refresh()
    assert.equal(recent.filePath, pdfExportKey(recent.id))
  })

  test('le job applique la rétention par défaut', async ({ assert }) => {
    const old = await completedExport(PDF_EXPORT_RETENTION_DAYS + 5)
    const recent = await completedExport(PDF_EXPORT_RETENTION_DAYS - 5)

    await PurgeExpiredPdfExportsJob.dispatch({}).run()

    disk.assertMissing(pdfExportKey(old.id))
    disk.assertExists(pdfExportKey(recent.id))
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

test.group('config/drive | disque s3', () => {
  test('aucune variable requise pour le disque fs', ({ assert }) => {
    assert.deepEqual(
      missingS3Env('fs', () => undefined),
      []
    )
  })

  test('liste les variables S3 manquantes', ({ assert }) => {
    const values: Record<string, string> = { S3_BUCKET: 'exports', S3_ENDPOINT: 'https://r2' }
    assert.deepEqual(
      missingS3Env('s3', (name) => values[name]),
      ['S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY']
    )
  })
})
