import Employee from '#models/employee'
import PdfExport from '#models/pdf_export'
import type User from '#models/user'
import { teamEmployeeScope } from '#services/team_employee_scope_service'
import { PDF_EXPORT_STATUSES, type PdfExportStatus } from '#shared/constants/pdf_export'
import { isSuperAdmin } from '#shared/helpers/roles'
import type { PdfExportListFilters } from '#shared/types/pdf_export/list'
import { inject } from '@adonisjs/core'

const LIST_LIMIT = 100

/**
 * Liste de suivi des exports PDF. Le super admin voit tout ; les autres
 * membres d'équipe, les exports des candidats de leur périmètre
 * (`teamEmployeeScope` : organisation, et candidats assignés dans
 * l'organisation plateforme).
 */
@inject()
export class PdfExportsService {
  public async listForUser(user: User, filters: PdfExportListFilters = {}): Promise<PdfExport[]> {
    const query = PdfExport.query()

    if (!isSuperAdmin(user.role)) {
      query.whereIn('employeeId', Employee.query().select('id').where(teamEmployeeScope(user)))
    }

    if (
      filters.status &&
      Object.values(PDF_EXPORT_STATUSES).includes(filters.status as PdfExportStatus)
    ) {
      query.where('status', filters.status)
    }

    return query.preload('employee').orderBy('createdAt', 'desc').limit(LIST_LIMIT)
  }
}
