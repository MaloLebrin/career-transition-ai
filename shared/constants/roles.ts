import type { UserRole } from '#shared/types/advisor/roles'
import { USERS_ROLES } from '#shared/types/advisor/roles'

/** Texte d’aide pour chaque rôle utilisateur (filtres, sélecteurs super admin, etc.). */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [USERS_ROLES.EMPLOYEE]:
    'Compte talent : accès au parcours personnel et aux outils côté collaborateur.',
  [USERS_ROLES.ADVISOR]:
    'Accompagne les talents au quotidien et pilote les dossiers dans le cabinet.',
  [USERS_ROLES.EXPERT]: 'Intervient en expertise sur des dossiers ; accès conseiller ciblé.',
  [USERS_ROLES.ADMIN]: 'Gère les utilisateurs et les réglages de son organisation (cabinet).',
  [USERS_ROLES.SUPER_ADMIN]:
    'Administration globale de la plateforme (organisations, utilisateurs, supervision).',
} as const

/** Description de l’option « tous les rôles » dans un filtre. */
export const ROLE_FILTER_ALL_DESCRIPTION = 'Affiche tous les comptes sans filtrer par type de rôle.'
