import { parseListParams } from '#shared/helpers/pagination'
import { USERS_ROLES, type UserRole } from '#shared/types/advisor/roles'
import type { OrganizationListParams, UserListParams } from '#shared/types/super_admin/lists'

/** `?page=&search=&minEmployees=` des organisations ; seuil entier ≥ 1, sinon pas de filtre. */
export function parseOrganizationListParams(qs: Record<string, unknown>): OrganizationListParams {
  const min = Number.parseInt(String(qs.minEmployees ?? ''), 10)
  return { ...parseListParams(qs), minEmployees: Number.isInteger(min) && min > 0 ? min : null }
}

/** `?page=&search=&role=` des utilisateurs ; rôle inconnu ignoré. */
export function parseUserListParams(qs: Record<string, unknown>): UserListParams {
  const role = Object.values(USERS_ROLES).includes(qs.role as UserRole)
    ? (qs.role as UserRole)
    : null
  return { ...parseListParams(qs), role }
}
