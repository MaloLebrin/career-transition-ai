import type { UserRole } from '#shared/types/advisor/roles'
import { USERS_ROLES } from '#shared/types/advisor/roles'

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

export function isSuperAdmin(role: UserRole): boolean {
  return role === USERS_ROLES.SUPER_ADMIN
}

export function isOrganizationAdmin(role: UserRole): boolean {
  return role === USERS_ROLES.ADMIN
}

/**
 * Roles that use the conseiller dashboard (excludes super_admin, who has a dedicated area).
 */
export function isConseillerDashboardRole(role: UserRole | undefined | null): boolean {
  return role === USERS_ROLES.ADVISOR || role === USERS_ROLES.ADMIN || role === USERS_ROLES.EXPERT
}
