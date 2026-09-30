import type { Readable } from 'node:stream'

/** Archive ZIP de l'export RGPD prête à être relayée (`CandidateDataRequestsService.export`). */
export interface CandidateDataExport {
  stream: Readable
  fileName: string
}

/** État des droits RGPD affiché au candidat sur son profil (#70). */
export interface CandidateDataRights {
  /** Date ISO de la demande d'effacement, `null` si aucune demande en cours. */
  erasureRequestedAt: string | null
}
