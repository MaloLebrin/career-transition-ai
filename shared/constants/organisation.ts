import { USERS_ROLES, type UserRole } from '../types/advisor/roles.js'

export const MAX_LICENSES_CANDIDATES = 50
export const MAX_LICENSES_ADVISORS = 2

/**
 * Rôles qu'un administrateur peut donner à un membre de son cabinet. Le rôle
 * `expert` est réservé à l'équipe de la plateforme (`PLATFORM_TEAM_ROLES`).
 */
export const ORGANIZATION_TEAM_ROLES = [USERS_ROLES.ADMIN, USERS_ROLES.ADVISOR] as const
export type OrganizationTeamRole = (typeof ORGANIZATION_TEAM_ROLES)[number]

/** Rôles qui occupent une licence conseiller (compte non désactivé). */
export const LICENSED_ADVISOR_ROLES: readonly UserRole[] = ORGANIZATION_TEAM_ROLES

export const TEAM_ROLE_LABELS: Partial<Record<UserRole, string>> = {
  [USERS_ROLES.ADMIN]: 'Administrateur',
  [USERS_ROLES.ADVISOR]: 'Conseiller',
  [USERS_ROLES.EXPERT]: 'Expert',
}

/** Routes de gestion d'un membre (`start/routes/dashboard/conseiller/settings.ts`). */
export const ORGANIZATION_MEMBER_PATHS = {
  role: (id: number) => `/dashboard/conseiller/settings/organization/members/${id}/role`,
  disable: (id: number) => `/dashboard/conseiller/settings/organization/members/${id}/disable`,
  enable: (id: number) => `/dashboard/conseiller/settings/organization/members/${id}/enable`,
  reassign: (id: number) => `/dashboard/conseiller/settings/organization/members/${id}/reassign`,
} as const

/** Logo d'organisation (issue #51) : limites partagées front / validateur. */
export const ORGANIZATION_LOGO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'svg'] as const
export const ORGANIZATION_LOGO_MAX_SIZE = '2mb'

/** Routes du logo (`start/routes/dashboard/conseiller/settings.ts`). */
export const ORGANIZATION_LOGO_ROUTE = '/dashboard/conseiller/settings/organization/logo'

/**
 * Slug stable de l'organisation plateforme (recherche idempotente par le
 * seeder et les migrations). L'organisation elle-même est identifiée par
 * `organizations.is_platform` (#92) : ne jamais filtrer sur ce slug ailleurs.
 */
export const PLATFORM_ORGANIZATION_SLUG = 'ai-transition-carriere'
