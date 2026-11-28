import DomainException from '#exceptions/domain_exception'

/**
 * Erreurs métier des résultats d'exercice (`#services/exercise_results_service`).
 *
 * Elles étendent `DomainException` : `handler.ts` les traduit en flash +
 * redirect back sur une requête Inertia, en `{ message }` + statut sinon.
 */

/** Aucun résultat de ce type pour le candidat (ou type inconnu) → 404. */
export class ExerciseResultNotFoundError extends DomainException {
  constructor(message: string = 'Résultat d’exercice introuvable.') {
    super(message, { status: 404, code: 'E_EXERCISE_RESULT_NOT_FOUND' })
  }
}

/**
 * Relance manuelle d'une analyse IA (#171) refusée : l'analyse n'est pas en
 * échec (`failed`), ou le candidat n'y a plus droit (exercice B2C verrouillé).
 */
export class QualitativeAnalysisNotRetryableError extends DomainException {
  constructor(message: string = 'Cette analyse IA ne peut pas être relancée.') {
    super(message, { status: 409, code: 'E_QUALITATIVE_ANALYSIS_NOT_RETRYABLE' })
  }
}
