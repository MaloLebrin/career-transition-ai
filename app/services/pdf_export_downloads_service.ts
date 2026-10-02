import { inject } from '@adonisjs/core'
import { PdfExportNotFoundError, PdfExportNotReadyError } from '#exceptions/pdf_export_errors'
import Employee from '#models/employee'
import PdfExport from '#models/pdf_export'
import type User from '#models/user'
import { EntitlementsService } from '#services/entitlements_service'
import { PDF_MIME_TYPE, readPdfStream } from '#services/pdf_storage_service'
import { ACCOUNT_TYPES } from '#shared/constants/b2c'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import { isConseillerDashboardRole, isSuperAdmin } from '#shared/helpers/roles'
import type { PdfExportDownload } from '#shared/types/pdf_export/download'

/**
 * Téléchargement des exports PDF (`GET /dashboard/pdf-exports/:id/download`).
 *
 * La lecture est bornée à ce que l'utilisateur peut voir **dans la requête** :
 * un export hors de portée est introuvable (404), comme un export inexistant.
 * Le statut n'est examiné qu'ensuite, pour ne rien révéler des exports des
 * autres organisations.
 */
@inject()
export class PdfExportDownloadsService {
  constructor(private entitlements: EntitlementsService) {}

  /**
   * Export lisible par `user` :
   * - super admin : tous ;
   * - conseiller, expert, admin : ceux de son organisation ;
   * - candidat : ceux qu'il a demandés, ou ceux de sa fiche candidat — sauf un
   *   particulier B2C dont le forfait n'est pas (ou plus) réglé (#101) : 404,
   *   comme un export qui n'existerait pas.
   */
  public async findFor(user: User, exportId: number): Promise<PdfExport> {
    const query = PdfExport.query().where('id', exportId)

    if (isSuperAdmin(user.role)) {
      // Pas de restriction.
    } else if (isConseillerDashboardRole(user.role)) {
      query.where('organizationId', user.organizationId)
    } else {
      query.where((ownership) => {
        ownership
          .where('userId', user.id)
          .orWhereIn(
            'employeeId',
            Employee.query()
              .select('id')
              .where('userId', user.id)
              .where('organizationId', user.organizationId)
          )
      })
    }

    const pdfExport = await query.first()
    if (!pdfExport) {
      throw new PdfExportNotFoundError()
    }
    if (!isSuperAdmin(user.role) && !isConseillerDashboardRole(user.role)) {
      await this.assertCandidateEntitled(user)
    }
    return pdfExport
  }

  private async assertCandidateEntitled(user: User): Promise<void> {
    const employee = await Employee.query()
      .where('userId', user.id)
      .where('organizationId', user.organizationId)
      .first()
    if (
      employee?.accountType === ACCOUNT_TYPES.B2C &&
      !(await this.entitlements.hasResultsAccess(employee.id))
    ) {
      throw new PdfExportNotFoundError()
    }
  }

  /** Fichier d'un export terminé, relayé depuis Cloudinary (URL jamais transmise au navigateur). */
  public async open(user: User, exportId: number): Promise<PdfExportDownload> {
    const pdfExport = await this.findFor(user, exportId)

    if (pdfExport.status !== PDF_EXPORT_STATUSES.COMPLETED) {
      throw new PdfExportNotReadyError()
    }

    const key = pdfExport.filePath ?? ''
    // Le fichier a pu être écrit par le worker sur une autre machine : on le
    // lit depuis le stockage, et une clé absente ou hors préfixe vaut 404.
    const stream = key ? await readPdfStream(key) : null
    if (!stream) {
      throw new PdfExportNotFoundError('Le fichier PDF est introuvable sur le serveur.')
    }

    return {
      stream,
      fileName: pdfExport.fileName || `pdf_export_${pdfExport.id}.pdf`,
      mimeType: pdfExport.mimeType || PDF_MIME_TYPE,
    }
  }
}
