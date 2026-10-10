import DomainException from '#exceptions/domain_exception'

/**
 * Erreurs métier du chat candidat ↔ expert (`#services/chat_service`).
 *
 * Elles étendent `DomainException` : `handler.ts` les traduit en flash +
 * redirect back sur une requête Inertia, en `{ message }` + statut sinon.
 */

/** Conversation inconnue, ou réservée à un autre expert → 404 (jamais 403). */
export class ChatConversationNotFoundError extends DomainException {
  constructor(message: string = 'Conversation introuvable.') {
    super(message, { status: 404, code: 'E_CHAT_CONVERSATION_NOT_FOUND' })
  }
}

/** Membre d'un cabinet client : le chat d'experts est tenu par l'équipe de la plateforme → 403. */
export class ChatForbiddenError extends DomainException {
  constructor(
    message: string = 'La messagerie est réservée aux experts de la plateforme et aux candidats.'
  ) {
    super(message, { status: 403, code: 'E_CHAT_FORBIDDEN' })
  }
}

/** Message vide une fois nettoyé → 422. */
export class ChatMessageEmptyError extends DomainException {
  constructor(message: string = 'Le message est vide.') {
    super(message, { status: 422, code: 'E_CHAT_MESSAGE_EMPTY' })
  }
}
