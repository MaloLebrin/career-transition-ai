export const MAX_LICENSES_CANDIDATES = 50
export const MAX_LICENSES_ADVISORS = 2

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
