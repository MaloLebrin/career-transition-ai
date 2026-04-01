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

/** Texte d’aide court pour filtres ou sélecteurs de rôle (super admin, etc.). */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [USERS_ROLES.EMPLOYEE]:
    'Compte talent : accès au parcours personnel et aux outils côté collaborateur.',
  [USERS_ROLES.ADVISOR]:
    'Accompagne les talents au quotidien et pilote les dossiers dans le cabinet.',
  [USERS_ROLES.EXPERT]:
    'Intervient en expertise sur des dossiers ; accès conseiller ciblé.',
  [USERS_ROLES.ADMIN]:
    'Gère les utilisateurs et les réglages de son organisation (cabinet).',
  [USERS_ROLES.SUPER_ADMIN]:
    'Administration globale de la plateforme (organisations, utilisateurs, supervision).',
} as const

/** Description pour l’option « tous les rôles » dans un filtre. */
export const ROLE_FILTER_ALL_DESCRIPTION =
  'Affiche tous les comptes sans filtrer par type de rôle.'

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
