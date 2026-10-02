import DomainException from '#exceptions/domain_exception'

/**
 * Erreurs métier du domaine facturation / droits d'accès
 * (`#services/entitlements_service`, puis checkout et webhook Stripe).
 *
 * Elles étendent `DomainException` : `handler.ts` les traduit en flash +
 * redirect back sur une requête Inertia, en `{ message }` + statut sinon.
 */

/** Résultats, synthèse ou export demandés par un particulier qui n'a pas réglé le forfait → 403. */
export class ResultsLockedError extends DomainException {
  constructor(message: string = 'Ces résultats sont réservés au forfait.') {
    super(message, { status: 403, code: 'E_RESULTS_LOCKED' })
  }
}

/** Paiement inexistant, d'une autre organisation, ou qui n'ouvre plus de droit → 404. */
export class PaymentNotFoundError extends DomainException {
  constructor(message: string = 'Paiement introuvable.') {
    super(message, { status: 404, code: 'E_PAYMENT_NOT_FOUND' })
  }
}

/** Octroi manuel sur un candidat qui a déjà accès → 409. */
export class EntitlementAlreadyGrantedError extends DomainException {
  constructor(message: string = 'Ce candidat a déjà accès à ses résultats.') {
    super(message, { status: 409, code: 'E_ENTITLEMENT_ALREADY_GRANTED' })
  }
}

/** Paiement demandé par un particulier dont l'adresse e-mail n'est pas vérifiée (#98) → 403. */
export class EmailNotVerifiedError extends DomainException {
  constructor(
    message: string = 'Confirmez votre adresse e-mail avant de régler le forfait : le lien vous a été envoyé par e-mail.'
  ) {
    super(message, { status: 403, code: 'E_EMAIL_NOT_VERIFIED' })
  }
}

/** Démarrage d'un paiement alors que `STRIPE_ENABLED` est faux → 503. */
export class PaymentsDisabledError extends DomainException {
  constructor(message: string = 'Le paiement en ligne n’est pas encore disponible.') {
    super(message, { status: 503, code: 'E_PAYMENTS_DISABLED' })
  }
}

/** Clés Stripe absentes hors production (en production, le serveur refuse de démarrer) → 503. */
export class PaymentGatewayNotConfiguredError extends DomainException {
  constructor(
    message: string = 'Le paiement n’est pas configuré sur ce serveur (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET).'
  ) {
    super(message, { status: 503, code: 'E_PAYMENT_GATEWAY_NOT_CONFIGURED' })
  }
}

/** Session Checkout inconnue, ou qui n'appartient pas au candidat connecté → 404. */
export class CheckoutSessionNotFoundError extends DomainException {
  constructor(message: string = 'Session de paiement introuvable.') {
    super(message, { status: 404, code: 'E_CHECKOUT_SESSION_NOT_FOUND' })
  }
}

/** Webhook Stripe dont la signature ne correspond pas à `STRIPE_WEBHOOK_SECRET` → 400. */
export class InvalidStripeSignatureError extends DomainException {
  constructor(message: string = 'Signature Stripe invalide.') {
    super(message, { status: 400, code: 'E_INVALID_STRIPE_SIGNATURE' })
  }
}
