import DomainException from '#exceptions/domain_exception'

/**
 * Erreurs métier des fichiers rattachés (`#services/media_service`,
 * `#services/candidate_documents_service`).
 *
 * Elles étendent `DomainException` : `handler.ts` les traduit en flash +
 * redirect back sur une requête Inertia, en `{ message }` + statut sinon.
 */

/** Document absent, d'un autre candidat ou d'une autre organisation → 404. */
export class MediaNotFoundError extends DomainException {
  constructor(message: string = 'Document introuvable.') {
    super(message, { status: 404, code: 'E_MEDIA_NOT_FOUND' })
  }
}

/** Nombre maximal de documents atteint → 422. */
export class MediaLimitReachedError extends DomainException {
  constructor(max: number) {
    super(`Limite de ${max} documents atteinte : supprimez-en un avant d'en ajouter.`, {
      status: 422,
      code: 'E_MEDIA_LIMIT_REACHED',
    })
  }
}

/** Un candidat ne supprime que les documents qu'il a déposés → 403. */
export class MediaForbiddenError extends DomainException {
  constructor(message: string = 'Seul votre conseiller peut supprimer ce document.') {
    super(message, { status: 403, code: 'E_MEDIA_FORBIDDEN' })
  }
}
