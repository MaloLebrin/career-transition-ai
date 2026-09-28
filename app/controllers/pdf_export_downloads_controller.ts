import { PdfExportDownloadsService } from '#services/pdf_export_downloads_service'
import { attachmentDisposition } from '#services/pdf_storage_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class PdfExportDownloadsController {
  constructor(private downloads: PdfExportDownloadsService) {}

  /**
   * GET /dashboard/pdf-exports/:id/download — export hors de portée ou
   * inexistant : 404 (`PdfExportNotFoundError`) ; pas encore prêt : 409.
   */
  public async show({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const file = await this.downloads.open(user, Number(params.id))

    response.header('Content-Type', file.mimeType)
    response.header('Content-Disposition', attachmentDisposition(file.fileName))
    return response.stream(file.stream)
  }
}
