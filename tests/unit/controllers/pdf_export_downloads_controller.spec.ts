import PdfExportDownloadsController from '#controllers/pdf_export_downloads_controller'
import { PdfExportNotFoundError } from '#exceptions/pdf_export_errors'
import type { PdfExportDownload } from '#shared/types/pdf_export/download'
import { test } from '@japa/runner'
import { Readable } from 'node:stream'

/**
 * Contrôleur fin : l'accès et la lecture du fichier sont couverts par
 * `tests/unit/services/pdf_export_downloads_service.spec.ts` ; ici, la
 * délégation au service et les en-têtes de la réponse.
 */
class FakeDownloadsService {
  public calls: Array<{ userId: number; exportId: number }> = []

  constructor(private result: PdfExportDownload | Error) {}

  async open(user: { id: number }, exportId: number): Promise<PdfExportDownload> {
    this.calls.push({ userId: user.id, exportId })
    if (this.result instanceof Error) throw this.result
    return this.result
  }
}

function makeCtx(params: Record<string, string>) {
  const headers: Record<string, string> = {}
  let streamed: Readable | null = null
  return {
    headers,
    get streamed() {
      return streamed
    },
    ctx: {
      auth: { getUserOrFail: () => ({ id: 42 }) },
      params,
      response: {
        header(name: string, value: string) {
          headers[name] = value
        },
        stream(stream: Readable) {
          streamed = stream
        },
      },
    },
  }
}

test.group('PdfExportDownloadsController.show', () => {
  test('relaie le fichier du service avec type et nom de fichier', async ({ assert }) => {
    const stream = Readable.from(['%PDF-1.4 fake'])
    const service = new FakeDownloadsService({
      stream,
      fileName: 'Synthèse_Élise.pdf',
      mimeType: 'application/pdf',
    })
    const controller = new PdfExportDownloadsController(service as any)
    const context = makeCtx({ id: '7' })

    await controller.show(context.ctx as any)

    assert.deepEqual(service.calls, [{ userId: 42, exportId: 7 }])
    assert.strictEqual(context.streamed, stream)
    assert.equal(context.headers['Content-Type'], 'application/pdf')
    assert.include(context.headers['Content-Disposition'], 'filename="Synthese_Elise.pdf"')
    assert.include(
      context.headers['Content-Disposition'],
      "filename*=UTF-8''Synth%C3%A8se_%C3%89lise.pdf"
    )
  })

  test('laisse remonter les erreurs de domaine au handler (404)', async ({ assert }) => {
    const controller = new PdfExportDownloadsController(
      new FakeDownloadsService(new PdfExportNotFoundError()) as any
    )
    const context = makeCtx({ id: '7' })

    await assert.rejects(() => controller.show(context.ctx as any), PdfExportNotFoundError as any)
    assert.isNull(context.streamed)
  })
})
