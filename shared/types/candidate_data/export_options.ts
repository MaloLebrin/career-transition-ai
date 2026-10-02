/** Options de l'export RGPD d'un candidat (`candidateDataSnapshot`, `buildCandidateExportArchive`, #97). */
export interface CandidateExportOptions {
  /**
   * Inclure les notes `private` des conseillers dans `donnees.json`
   * (`advisorPrivateNotes`). Arbitrage PO / juridique en cours (droit d'accès
   * art. 15 vs appréciations internes) : `PRIVATE_NOTES_IN_EXPORT` donne la
   * politique par défaut, `candidate:export --without-private-notes` l'écarte.
   */
  includePrivateNotes: boolean
}
