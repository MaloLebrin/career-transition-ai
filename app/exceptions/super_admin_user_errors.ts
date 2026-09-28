import DomainException from '#exceptions/domain_exception'

/**
 * Erreurs métier de la gestion des utilisateurs par le super admin
 * (`#services/super_admin_users_service`).
 *
 * Elles étendent `DomainException` : `handler.ts` les traduit en flash +
 * redirect back sur une requête Inertia, en `{ message }` + statut sinon.
 */

/** Utilisateur absent, ou compte de l’organisation plateforme (hors périmètre) → 404. */
export class SuperAdminUserNotFoundError extends DomainException {
  constructor(message: string = 'Utilisateur introuvable.') {
    super(message, { status: 404, code: 'E_SUPER_ADMIN_USER_NOT_FOUND' })
  }
}

/** Son propre compte ou celui d’un autre super admin : rôle non modifiable → 422. */
export class SuperAdminRoleLockedError extends DomainException {
  constructor(message: string = 'Le rôle d’un super administrateur ne peut pas être modifié ici.') {
    super(message, { status: 422, code: 'E_SUPER_ADMIN_ROLE_LOCKED' })
  }
}
