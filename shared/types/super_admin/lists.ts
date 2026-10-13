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
}
