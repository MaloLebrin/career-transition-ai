/**
 * Sections de `donnees.json` (export RGPD) ajoutées pour couvrir tout ce que la
 * plateforme stocke sur le candidat (art. 15). Dates en ISO 8601.
 */

/** Synthèse d'accompagnement (`employee_syntheses`). */
export interface CandidateExportSynthesis {
  shareStatus: string
  sharedAt: string | null
  expertCommentsShared: string | null
  /**
   * Notes internes de l'expert : restituées selon la même politique que les notes
   * privées des conseillers (`PRIVATE_NOTES_IN_EXPORT`, #97), `null` sinon.
   */
  expertNotesInternal: string | null
  executiveSummaryOverride: string | null
  createdAt: string | null
  updatedAt: string | null
}

/** Notification reçue par le compte du candidat. */
export interface CandidateExportNotification {
  type: string
  status: string
  title: string
  body: string | null
  readAt: string | null
  createdAt: string | null
}
