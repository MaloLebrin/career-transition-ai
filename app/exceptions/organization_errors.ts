import DomainException from '#exceptions/domain_exception'

/**
 * Erreurs métier de la gestion des organisations par le super admin
 * (`#services/super_admin_organizations_service`).
 */

/** Organisation absente, ou organisation plateforme (hors périmètre) → 404. */
export class OrganizationNotFoundError extends DomainException {
  constructor(message: string = 'Organisation introuvable.') {
    super(message, { status: 404, code: 'E_ORGANIZATION_NOT_FOUND' })
  }
}
