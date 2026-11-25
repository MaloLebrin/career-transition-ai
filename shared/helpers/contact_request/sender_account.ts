import { USERS_ROLES, type UserRole } from '#shared/types/advisor/roles'

/** Compte rapproché d'une demande de contact par son adresse e-mail. */
export interface SenderAccountRef {
  id: number
  role: UserRole
  organizationId: number
}

/** Forme de comparaison d'une adresse : sans espaces, en minuscules. */
export function normalizeContactEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Le compte peut-il être géré depuis la boîte des demandes de contact ? Oui pour les
 * organisations clientes et pour les candidats de l'organisation plateforme (particuliers) ;
 * l'équipe plateforme (experts, admins) se gère depuis son propre écran.
 */
export function isSenderAccountInScope(
  platformOrganizationId: number,
  account: SenderAccountRef
): boolean {
  return account.organizationId !== platformOrganizationId || account.role === USERS_ROLES.EMPLOYEE
}

/** Ni soi-même, ni un super admin, et seulement un compte à portée. */
export function canDisableSenderAccount(
  actorId: number,
  platformOrganizationId: number,
  account: SenderAccountRef
): boolean {
  return (
    account.id !== actorId &&
    account.role !== USERS_ROLES.SUPER_ADMIN &&
    isSenderAccountInScope(platformOrganizationId, account)
  )
}
