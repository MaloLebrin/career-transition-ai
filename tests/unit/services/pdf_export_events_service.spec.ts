import PdfExport from '#models/pdf_export'
import { broadcastPdfExportUpdatedToUsers } from '#services/pdf_export_events_service'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import transmit from '@adonisjs/transmit/services/main'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

type Broadcast = { channel: string; payload: Record<string, unknown> }

/** Remplace `transmit.broadcast` par un enregistreur le temps du test. */
function captureBroadcasts(cleanup: (fn: () => void) => void): Broadcast[] {
  const calls: Broadcast[] = []
  const original = transmit.broadcast
  transmit.broadcast = ((channel: string, payload: Record<string, unknown>) => {
    calls.push({ channel, payload })
  }) as typeof transmit.broadcast
  cleanup(() => {
    transmit.broadcast = original
  })
  return calls
}

/** Export en mémoire (aucune écriture en base : le service ne fait que sérialiser). */
function makeExport(overrides: Partial<PdfExport> = {}): PdfExport {
  const row = new PdfExport()
  row.merge({
    id: 42,
    userId: 7,
    advisorUserId: 8,
    organizationId: 3,
    employeeId: 11,
    status: PDF_EXPORT_STATUSES.COMPLETED,
    errorMessage: null,
    fileName: 'synthese.pdf',
    startedAt: DateTime.fromISO('2026-01-02T10:00:00.000Z', { zone: 'utc' }),
    finishedAt: DateTime.fromISO('2026-01-02T10:01:00.000Z', { zone: 'utc' }),
    ...overrides,
  })
  row.createdAt = DateTime.fromISO('2026-01-02T09:59:00.000Z', { zone: 'utc' })
  return row
}

test.group('broadcastPdfExportUpdatedToUsers', () => {
  test("diffuse l'export sérialisé à chaque utilisateur et à l'organisation", ({
    assert,
    cleanup,
  }) => {
    const calls = captureBroadcasts(cleanup)

    broadcastPdfExportUpdatedToUsers(makeExport(), [7, 8])

    assert.deepEqual(
      calls.map((c) => c.channel),
      ['users/7/pdf-exports', 'users/8/pdf-exports', 'organizations/3/pdf-exports']
    )
    assert.deepEqual(calls[0].payload, {
      id: 42,
      userId: 7,
      advisorUserId: 8,
      organizationId: 3,
      employeeId: 11,
      status: PDF_EXPORT_STATUSES.COMPLETED,
      errorMessage: null,
      fileName: 'synthese.pdf',
      createdAt: '2026-01-02T09:59:00.000Z',
      startedAt: '2026-01-02T10:00:00.000Z',
      finishedAt: '2026-01-02T10:01:00.000Z',
    })
    // Même charge utile sur tous les canaux.
    assert.isTrue(calls.every((c) => c.payload === calls[0].payload))
  })

  test('dédoublonne les destinataires et ignore les ids non finis', ({ assert, cleanup }) => {
    const calls = captureBroadcasts(cleanup)

    broadcastPdfExportUpdatedToUsers(makeExport(), [7, 7, Number.NaN, 9, Number.POSITIVE_INFINITY])

    assert.deepEqual(
      calls.map((c) => c.channel),
      ['users/7/pdf-exports', 'users/9/pdf-exports', 'organizations/3/pdf-exports']
    )
  })

  test("sans organisation, aucune diffusion sur un canal d'organisation", ({ assert, cleanup }) => {
    const calls = captureBroadcasts(cleanup)

    broadcastPdfExportUpdatedToUsers(makeExport({ organizationId: null }), [7])

    assert.deepEqual(
      calls.map((c) => c.channel),
      ['users/7/pdf-exports']
    )
  })

  test('dates de démarrage/fin absentes → null ; erreur transmise', ({ assert, cleanup }) => {
    const calls = captureBroadcasts(cleanup)

    broadcastPdfExportUpdatedToUsers(
      makeExport({
        status: PDF_EXPORT_STATUSES.FAILED,
        errorMessage: 'boom',
        fileName: null,
        startedAt: null,
        finishedAt: null,
      }),
      []
    )

    assert.lengthOf(calls, 1)
    assert.equal(calls[0].channel, 'organizations/3/pdf-exports')
    assert.include(calls[0].payload, {
      status: PDF_EXPORT_STATUSES.FAILED,
      errorMessage: 'boom',
      fileName: null,
      startedAt: null,
      finishedAt: null,
    })
  })
})
