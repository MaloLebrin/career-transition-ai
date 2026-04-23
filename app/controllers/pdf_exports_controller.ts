import { serializePdfExport } from '#mappers/pdf_export_mapper'
import PdfExport from '#models/pdf_export'
import { PDF_EXPORT_STATUSES, type PdfExportStatus } from '#shared/constants/pdf_export'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import type { HttpContext } from '@adonisjs/core/http'

export default class PdfExportsController {
  public async index({ auth, request, inertia }: HttpContext) {
    const user = auth.user
    if (!user) {
      return
    }

    const qs = request.qs() as { status?: string }

    let query = PdfExport.query()

    if (user.role !== USERS_ROLES.SUPER_ADMIN) {
      query = query.where('organizationId', user.organizationId)
    }

    if (qs.status && Object.values(PDF_EXPORT_STATUSES).includes(qs.status as PdfExportStatus)) {
      query = query.where('status', qs.status)
    }

    const rows = await query.orderBy('createdAt', 'desc').limit(100)
    const exports = rows.map(serializePdfExport)

    return (inertia as any).render('dashboard/admin/jobs/Index', { exports })
  }
}
