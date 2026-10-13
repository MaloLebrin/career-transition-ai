import { serializePdfExport } from '#mappers/pdf_export_mapper'
import { PdfExportsService } from '#services/pdf_exports_service'
import { PDF_EXPORT_STATUSES, type PdfExportStatus } from '#shared/constants/pdf_export'
import { parsePage } from '#shared/helpers/pagination'
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

    const qs = request.qs() as { status?: string; page?: string }
    const { items, pagination } = await this.pdfExports.listForUser(user, {
      status: qs.status,
      page: parsePage(qs.page),
    })
    const exports = items.map((row) => serializePdfExport(row, row.employee?.name ?? null))

    const status = Object.values(PDF_EXPORT_STATUSES).includes(qs.status as PdfExportStatus)
      ? qs.status
      : 'all'

    return (inertia as any).render('dashboard/admin/jobs/Index', {
      exports,
      pagination,
      filters: { status },
    })
  }
}
