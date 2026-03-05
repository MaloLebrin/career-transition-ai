import type { UserSession } from '../services/authService'

type Role = UserSession['role'] | undefined | null

export function isSuperAdmin(role: Role): boolean {
  return role === 'super_admin'
}

export function isOrganizationAdmin(role: Role): boolean {
  return role === 'admin'
}

export function isAdmin(role: Role): boolean {
  return isOrganizationAdmin(role) || isSuperAdmin(role)
}

export function isAdvisorOrAdmin(role: Role): boolean {
  return role === 'advisor' || isAdmin(role)
}
