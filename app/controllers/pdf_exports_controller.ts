import { serializePdfExport } from '#mappers/pdf_export_mapper'
import { PdfExportsService } from '#services/pdf_exports_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class PdfExportsController {
  constructor(private pdfExports: PdfExportsService) {}

  public async index({ auth, request, inertia }: HttpContext) {
    const user = auth.user
    if (!user) {
      return
    }

    const qs = request.qs() as { status?: string }
    const rows = await this.pdfExports.listForUser(user, { status: qs.status })
    const exports = rows.map((row) => serializePdfExport(row, row.employee?.name ?? null))

    return (inertia as any).render('dashboard/admin/jobs/Index', { exports })
  }
}
