/** Entrée de `ExpertRequestsService.createForUser` (#103). */
export interface CreateExpertRequestInput {
  /** Ce que le candidat attend de l'accompagnement (texte libre, ≤ 2000 caractères). */
  message: string
  /** Disponibilités indiquées par le candidat, optionnelles. */
  availability?: string | null
}
