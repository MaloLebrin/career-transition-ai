import PdfExport from '#models/pdf_export'
import Employee from '#models/employee'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import type { HttpContext } from '@adonisjs/core/http'
import { access } from 'node:fs/promises'

export default class PdfExportDownloadsController {
  /**
   * GET /dashboard/pdf-exports/:id/download
   */
  public async show(ctx: HttpContext) {
    const user = ctx.auth.user
    if (!user) {
      return ctx.response.unauthorized()
    }

    const exportId = Number(ctx.params.id)
    const pdfExport = await PdfExport.findOrFail(exportId)

    if (pdfExport.status !== PDF_EXPORT_STATUSES.COMPLETED) {
      return ctx.response.badRequest('Export not completed')
    }

    if (user.role === USERS_ROLES.SUPER_ADMIN) {
      // ok
    } else if (user.role === USERS_ROLES.ADMIN || user.role === USERS_ROLES.ADVISOR) {
      if (pdfExport.organizationId !== user.organizationId) {
        return ctx.response.forbidden()
      }
    } else {
      if (pdfExport.userId === user.id) {
        // ok
      } else {
        const employee = await Employee.query()
          .where('userId', user.id)
          .where('organizationId', user.organizationId)
          .first()
        if (!employee || employee.id !== pdfExport.employeeId) {
          return ctx.response.forbidden()
        }
      }
    }

    const filePath = String(pdfExport.filePath || '')
    const fileName = String(pdfExport.fileName || `pdf_export_${pdfExport.id}.pdf`)

    if (!filePath) {
      return ctx.response.notFound()
    }

    try {
      await access(filePath)
    } catch {
      return ctx.response.notFound('Le fichier PDF est introuvable sur le serveur.')
    }

    return ctx.response.attachment(filePath, fileName)
  }
}
