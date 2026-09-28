import { serializePdfExport } from '#mappers/pdf_export_mapper'
import PdfExport from '#models/pdf_export'
import { PDF_EXPORT_STATUSES, type PdfExportStatus } from '#shared/constants/pdf_export'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const CREATED_AT = DateTime.fromISO('2026-09-01T10:00:00.000+02:00', { setZone: true })

function makeExport(overrides: Partial<PdfExport> = {}): PdfExport {
  const row = new PdfExport()
  row.merge({
    userId: 3,
    organizationId: 5,
    employeeId: 11,
    advisorUserId: 4,
    status: PDF_EXPORT_STATUSES.PENDING,
    errorMessage: null,
    filePath: null,
    fileName: null,
    mimeType: null,
    size: null,
    startedAt: null,
    finishedAt: null,
    ...overrides,
  })
  row.id = 99
  row.createdAt = CREATED_AT
  return row
}

test.group('mappers/pdf_export_mapper — serializePdfExport', () => {
  test('export terminé avec fichier : lien de téléchargement relayé par le serveur', ({
    assert,
  }) => {
    const started = CREATED_AT.plus({ seconds: 5 })
    const finished = CREATED_AT.plus({ seconds: 30 })
    const row = makeExport({
      status: PDF_EXPORT_STATUSES.COMPLETED,
      filePath: 'pdf-exports/org-5/export-99',
      fileName: 'synthese-11.pdf',
      startedAt: started,
      finishedAt: finished,
    })

    assert.deepEqual(serializePdfExport(row, '[nom affiché]'), {
      id: 99,
      userId: 3,
      organizationId: 5,
      employeeId: 11,
      employeeName: '[nom affiché]',
      advisorUserId: 4,
      status: 'completed',
      errorMessage: null,
      createdAt: CREATED_AT.toISO()!,
      startedAt: started.toISO(),
      finishedAt: finished.toISO(),
      downloadUrl: '/dashboard/pdf-exports/99/download',
      fileName: 'synthese-11.pdf',
    })
  })

  test('jamais d’URL de stockage exposée : seul l’identifiant apparaît', ({ assert }) => {
    const row = makeExport({
      status: PDF_EXPORT_STATUSES.COMPLETED,
      filePath: 'https://res.cloudinary.com/demo/raw/authenticated/secret.pdf',
    })
    const dto = serializePdfExport(row)
    assert.notInclude(JSON.stringify(dto), 'cloudinary')
    assert.notProperty(dto, 'filePath')
    assert.notProperty(dto, 'mimeType')
    assert.notProperty(dto, 'size')
  })

  test('pas de lien tant que l’export n’est pas terminé', ({ assert }) => {
    const statuses: PdfExportStatus[] = [
      PDF_EXPORT_STATUSES.PENDING,
      PDF_EXPORT_STATUSES.PROCESSING,
      PDF_EXPORT_STATUSES.FAILED,
    ]
    for (const status of statuses) {
      const row = makeExport({ status, filePath: 'pdf-exports/x' })
      assert.isNull(serializePdfExport(row).downloadUrl, status)
    }
  })

  test('terminé mais fichier purgé (rétention dépassée) : pas de lien', ({ assert }) => {
    const row = makeExport({ status: PDF_EXPORT_STATUSES.COMPLETED, filePath: null })
    assert.isNull(serializePdfExport(row).downloadUrl)

    const empty = makeExport({ status: PDF_EXPORT_STATUSES.COMPLETED, filePath: '' })
    assert.isNull(serializePdfExport(empty).downloadUrl)
  })

  test('échec : message d’erreur transmis, dates optionnelles à null', ({ assert }) => {
    const row = makeExport({
      status: PDF_EXPORT_STATUSES.FAILED,
      errorMessage: 'Timeout Chromium',
    })
    const dto = serializePdfExport(row)
    assert.equal(dto.status, 'failed')
    assert.equal(dto.errorMessage, 'Timeout Chromium')
    assert.isNull(dto.startedAt)
    assert.isNull(dto.finishedAt)
    assert.isNull(dto.fileName)
  })

  test('nom du candidat optionnel : null par défaut', ({ assert }) => {
    assert.isNull(serializePdfExport(makeExport()).employeeName)
  })

  test('dates en ISO 8601, fuseau conservé', ({ assert }) => {
    const dto = serializePdfExport(makeExport())
    assert.equal(dto.createdAt, '2026-09-01T10:00:00.000+02:00')
  })
})
