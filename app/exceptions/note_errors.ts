import DomainException from '#exceptions/domain_exception'

/**
 * Erreurs métier du domaine Notes (`#services/notes_service`).
 *
 * Elles étendent `DomainException` : `handler.ts` les traduit en flash +
 * redirect back sur une requête Inertia, en `{ message }` + statut sinon.
 */

/** Note (ou candidat) absente, supprimée ou hors de l'organisation → 404. */
export class NoteNotFoundError extends DomainException {
  constructor(message: string = 'Note not found') {
    super(message, { status: 404, code: 'E_NOTE_NOT_FOUND' })
  }
}

/** Rôle non autorisé à écrire des notes, ou utilisateur qui n'est pas l'auteur → 403. */
export class NoteForbiddenError extends DomainException {
  constructor(message: string) {
    super(message, { status: 403, code: 'E_NOTE_FORBIDDEN' })
  }
}

/** Étape ou résultat d'exercice lié qui n'appartient pas au candidat → 400. */
export class NoteLinkedResourceNotFoundError extends DomainException {
  constructor(message: string) {
    super(message, { status: 400, code: 'E_NOTE_LINKED_RESOURCE_NOT_FOUND' })
  }
}
