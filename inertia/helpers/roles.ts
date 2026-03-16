import { USERS_ROLES } from '#shared/constants/user'
import type { UserSession } from '../types/auth'

type Role = UserSession['role'] | undefined | null

export function isSuperAdmin(role: Role): boolean {
  return role === USERS_ROLES.SUPER_ADMIN
}

export function isOrganizationAdmin(role: Role): boolean {
  return role === USERS_ROLES.ADMIN
}

export function isAdmin(role: Role): boolean {
  return isOrganizationAdmin(role) || isSuperAdmin(role)
}

export function isAdvisorOrAdmin(role: Role): boolean {
  return role === USERS_ROLES.ADVISOR || isAdmin(role)
}
