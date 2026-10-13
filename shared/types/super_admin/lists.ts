import type { UserRole } from '#shared/types/advisor/roles'
import type { ListParams } from '#shared/types/pagination'

/** Paramètres de la liste des organisations clientes (`?page=&search=&minEmployees=`). */
export interface OrganizationListParams extends ListParams {
  /** Nombre minimal de candidats ; `null` = pas de filtre. */
  minEmployees: number | null
}

export interface OrganizationListItem {
  id: number
  name: string
  slug: string
  /** Premier admin (à défaut, premier compte) : cible de l'impersonation et du lien de réinitialisation. */
  ownerId: number | null
  usersCount: number
  employeesCount: number
  createdAt: string | null
}

/** Paramètres de la liste des utilisateurs (`?page=&search=&role=`). */
export interface UserListParams extends ListParams {
  /** Rôle filtré ; `null` = tous. */
  role: UserRole | null
}

export interface UserListItem {
  id: number
  name: string
  email: string
  role: UserRole
  organization: { id: number; name: string } | null
  createdAt: string | null
  onboardingCompleted: boolean
  /** Compte désactivé (connexion refusée) ; `null` = actif. */
  disabledAt: string | null
}

/** Détail d'une organisation cliente pour le super admin. */
export interface OrganizationDetail {
  id: number
  name: string
  slug: string
  createdAt: string | null
  usersCount: number
  employeesCount: number
  members: Array<{
    id: number
    name: string
    email: string
    role: UserRole
    onboardingCompleted: boolean
    disabledAt: string | null
  }>
}

export interface OrganizationUpdateInput {
  name: string
  slug?: string
}

export interface UserUpdateInput {
  name: string
  email: string
}
