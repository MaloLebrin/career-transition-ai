import DomainException from '#exceptions/domain_exception'

/**
 * Erreurs du domaine « plateforme » (`#services/platform_organization_service`).
 *
 * Elles étendent `DomainException` : `handler.ts` les traduit en flash +
 * redirect back sur une requête Inertia, en `{ message }` + statut sinon.
 */

/** Aucune organisation `is_platform` en base (seeder non joué) → 503. */
export class PlatformOrganizationMissingError extends DomainException {
  constructor(
    message: string = 'Organisation plateforme introuvable : exécuter `node ace db:seed` (AdminSeeder).'
  ) {
    super(message, { status: 503, code: 'E_PLATFORM_ORGANIZATION_MISSING' })
  }
}
