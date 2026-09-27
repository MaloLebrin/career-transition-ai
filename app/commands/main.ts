import { ListLoader } from '@adonisjs/core/ace'
import type { CommandMetaData } from '@adonisjs/core/types/ace'
import CandidateExport from '#commands/candidate_export'
import CandidatePurge from '#commands/candidate_purge'
import ErrorTrackingTest from '#commands/error_tracking_test'

/**
 * Commandes ace de l'application, enregistrées dans `adonisrc.ts` comme
 * celles d'un package.
 *
 * Elles ne vivent pas dans `./commands` : ce dossier est lu par le `FsLoader`
 * d'ace, qui valide chaque commande avec `jsonschema@1.5.0`. Sous Node ≥ 24.21,
 * cette validation lève « Invalid URL » (`new URL(ref, 'thismessage::/')`
 * refusé par le parseur WHATWG) pour **n'importe quelle** commande — et le
 * boot du kernel ace échoue, y compris pour `migration:run` lancé par les
 * tests. Le `ListLoader` ne passe pas par cette validation.
 */
const loader = new ListLoader([CandidateExport, CandidatePurge, ErrorTrackingTest])

export function getMetaData() {
  return loader.getMetaData()
}

export function getCommand(metaData: CommandMetaData) {
  return loader.getCommand(metaData)
}
