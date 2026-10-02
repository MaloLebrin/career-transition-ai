import { isConseillerDashboardRole, isSuperAdmin } from '#shared/helpers/roles'
import type { UserRole } from '#shared/types/advisor/roles'

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
