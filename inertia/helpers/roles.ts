import type { UserSession } from '../services/authService'

export function isAdmin(role: UserSession['role'] | undefined | null): boolean {
  return role === 'admin' || role === 'super_admin'
}

export function isAdvisorOrAdmin(role: UserSession['role'] | undefined | null): boolean {
  return role === 'advisor' || isAdmin(role)
}
