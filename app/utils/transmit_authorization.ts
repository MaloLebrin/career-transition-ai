import { isConseillerDashboardRole, isSuperAdmin } from '#shared/helpers/roles'
import { USERS_ROLES, type UserRole } from '#shared/types/advisor/roles'

type TransmitUser = { role: UserRole; organizationId: number | null }

/**
 * Canal `organizations/:orgId/pdf-exports` : super admin, ou conseiller /
 * admin / expert de cette organisation. Jamais un candidat.
 */
export function canSubscribeToOrganizationPdfExports(
  user: TransmitUser | null | undefined,
  orgId: string
): boolean {
  if (!user) return false
  if (isSuperAdmin(user.role)) return true
  if (!isConseillerDashboardRole(user.role)) return false
  return user.organizationId !== null && user.organizationId === Number(orgId)
}

export type ChatSubscriptionAccess = {
  /** `users.id` du candidat propriétaire de la conversation. */
  candidateUserId: number | null
  /** Expert responsable (fiche ou prise en charge), `null` : conversation dans la file. */
  effectiveExpertId: number | null
  /** L'utilisateur est un membre de l'équipe de la plateforme (advisor, expert, admin). */
  isPlatformMember: boolean
}

/**
 * Canal `chat/conversations/:id` : le candidat propriétaire, l'expert
 * responsable, tout membre de l'équipe pour une conversation de la file, un
 * administrateur de la plateforme, ou un super admin. Jamais un cabinet client.
 */
export function canSubscribeToChatConversation(
  user: (TransmitUser & { id: number }) | null | undefined,
  access: ChatSubscriptionAccess | null
): boolean {
  if (!user || !access) return false
  if (isSuperAdmin(user.role)) return true
  if (user.role === USERS_ROLES.EMPLOYEE) {
    return access.candidateUserId !== null && access.candidateUserId === user.id
  }
  if (!access.isPlatformMember) return false
  if (user.role === USERS_ROLES.ADMIN) return true
  return access.effectiveExpertId === null || access.effectiveExpertId === user.id
}
