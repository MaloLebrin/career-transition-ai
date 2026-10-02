import { args, BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'

/**
 * Droit d'accès (RGPD) : exporte le dossier d'un candidat dans un ZIP
 * (profil et résultats en PDF + `donnees.json`). Procédure : docs/RGPD.md.
 */
export default class CandidateExport extends BaseCommand {
  static commandName = 'candidate:export'
  static description =
    "RGPD — exporte les données d'un candidat (ZIP : PDF du dossier + donnees.json)"

  static options: CommandOptions = { startApp: true }

  @args.string({ description: 'Identifiant de la fiche candidat (employees.id)' })
  declare employeeId: string

  @flags.string({ description: 'Chemin du ZIP produit (défaut : tmp/rgpd/<fichier>.zip)' })
  declare out?: string

  @flags.boolean({
    description:
      'Exclure les notes privées des conseillers de donnees.json (arbitrage RGPD en cours, #97)',
  })
  declare withoutPrivateNotes: boolean

  async run() {
    const { buildCandidateExportArchive, DEFAULT_EXPORT_OPTIONS, loadCandidateForExport } =
      await import('#services/candidate_data_service')
    const { dossierZipFilename } = await import('#services/dossier_export_service')

    const id = Number(this.employeeId)
    const employee = Number.isInteger(id) && id > 0 ? await loadCandidateForExport(id) : null
    if (!employee) {
      this.logger.error(`Candidat introuvable : ${this.employeeId}`)
      this.exitCode = 1
      return
    }

    const target = resolve(this.out ?? `tmp/rgpd/${dossierZipFilename(employee.name)}`)
    await mkdir(dirname(target), { recursive: true })
    const includePrivateNotes = this.withoutPrivateNotes
      ? false
      : DEFAULT_EXPORT_OPTIONS.includePrivateNotes
    await pipeline(
      await buildCandidateExportArchive(employee, { includePrivateNotes }),
      createWriteStream(target)
    )

    this.logger.success(
      `Export du candidat #${employee.id} écrit dans ${target} (notes privées des conseillers ${includePrivateNotes ? 'incluses' : 'exclues'})`
    )
  }
}
