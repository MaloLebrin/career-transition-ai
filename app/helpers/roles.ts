import type { UserRole } from '#shared/constants/user'
import { USERS_ROLES } from '#shared/constants/user'

/**
 * User has admin or super_admin role (organization admin).
 */
export function isAdmin(role: UserRole | undefined | null): boolean {
  return role === USERS_ROLES.ADMIN || role === USERS_ROLES.SUPER_ADMIN
}

/**
 * User can access advisor UI and see candidats / settings (advisor or admin).
 */
export function isAdvisorOrAdmin(role: UserRole | undefined | null): boolean {
  return role === USERS_ROLES.ADVISOR || isAdmin(role)
}
