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

export const ROLE_LABELS: Record<UserRole, string> = {
  [USERS_ROLES.EMPLOYEE]: 'Talent',
  [USERS_ROLES.ADVISOR]: 'Consultant Accompagnateur',
  [USERS_ROLES.EXPERT]: 'Expert Référent',
  [USERS_ROLES.ADMIN]: 'Admin orga',
  [USERS_ROLES.SUPER_ADMIN]: 'Super admin',
} as const

const ROLE_CATEGORY: Record<string, string> = {
  SUPER_ADMIN: 'super-admin',
  EXPERT: 'expert',
  TALENT: 'talent',
} as const

export type RoleCategory = (typeof ROLE_CATEGORY)[keyof typeof ROLE_CATEGORY]

export const ROLE_CATEGORY_LABELS: Record<RoleCategory, string> = {
  [ROLE_CATEGORY.SUPER_ADMIN]: 'Super admin',
  [ROLE_CATEGORY.EXPERT]: 'Expert',
  [ROLE_CATEGORY.TALENT]: 'Talent',
} as const
