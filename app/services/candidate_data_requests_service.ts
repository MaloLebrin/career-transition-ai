import {
  CandidateProfileNotFoundError,
  ErasureAlreadyRequestedError,
} from '#exceptions/candidate_data_errors'
import Employee from '#models/employee'
import type User from '#models/user'
import {
  buildCandidateExportArchive,
  loadCandidateForExport,
} from '#services/candidate_data_service'
import { CandidateNotificationsService } from '#services/candidate_notifications_service'
import { dossierZipFilename } from '#services/dossier_export_service'
import type { CandidateDataExport } from '#shared/types/candidate_data/requests'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'

/**
 * Droits RGPD exercés par le candidat depuis l'app (#70), en complément des
 * commandes `candidate:export` / `candidate:purge` (docs/RGPD.md) :
 * - accès et portabilité : même archive que `candidate:export`, téléchargée
 *   directement ;
 * - effacement : la demande est enregistrée et l'équipe prévenue ; la
 *   suppression reste faite par `candidate:purge` (irréversible, fichiers
 *   Cloudinary compris), dans le délai d'un mois.
 */
@inject()
export class CandidateDataRequestsService {
  constructor(private notifications: CandidateNotificationsService) {}

  /** Fiche du candidat connecté, scopée à son organisation. */
  private async ownEmployee(user: User): Promise<Employee> {
    const employee = await Employee.query()
      .where('userId', user.id)
      .where('organizationId', user.organizationId)
      .whereNull('deletedAt')
      .first()
    if (!employee) throw new CandidateProfileNotFoundError()
    return employee
  }

  async export(user: User): Promise<CandidateDataExport> {
    const { id } = await this.ownEmployee(user)
    const employee = await loadCandidateForExport(id)
    if (!employee) throw new CandidateProfileNotFoundError()
    return {
      stream: await buildCandidateExportArchive(employee),
      fileName: dossierZipFilename(employee.name),
    }
  }

  async requestErasure(user: User): Promise<void> {
    const employee = await this.ownEmployee(user)
    if (employee.erasureRequestedAt) throw new ErasureAlreadyRequestedError()

    employee.erasureRequestedAt = DateTime.now()
    await employee.save()
    await this.notifications.erasureRequested(employee)
  }
}
