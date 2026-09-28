import { args, BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Droit à l'effacement (RGPD) : supprime définitivement un candidat, son
 * compte et ses données. Procédure : docs/RGPD.md.
 */
export default class CandidatePurge extends BaseCommand {
  static commandName = 'candidate:purge'
  static description = 'RGPD — supprime définitivement un candidat et toutes ses données'

  static options: CommandOptions = { startApp: true }

  @args.string({ description: 'Identifiant de la fiche candidat (employees.id)' })
  declare employeeId: string

  @flags.boolean({ description: 'Ne pas demander de confirmation' })
  declare force: boolean

  async run() {
    const { previewCandidatePurge, purgeCandidate } =
      await import('#services/candidate_data_service')

    const id = Number(this.employeeId)
    const preview = Number.isInteger(id) && id > 0 ? await previewCandidatePurge(id) : null
    if (!preview) {
      this.logger.error(`Candidat introuvable : ${this.employeeId}`)
      this.exitCode = 1
      return
    }

    this.logger.info(`Suppression définitive du candidat #${id} :`)
    this.logger.log(JSON.stringify(preview, null, 2))

    if (!this.force) {
      const confirmed = await this.prompt.confirm('Confirmer la suppression définitive ?')
      if (!confirmed) {
        this.logger.info('Annulé, rien n’a été supprimé.')
        return
      }
    }

    const summary = await purgeCandidate(id)
    this.logger.success(
      `Candidat #${id} supprimé (${summary?.filesDeleted ?? 0} fichier(s) (PDF et documents) effacé(s) du stockage, compte ${summary?.userDeleted ? 'supprimé' : 'non supprimé'}).`
    )
  }
}
