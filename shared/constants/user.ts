export const USERS_ROLES = {
  ADVISOR: 'advisor',
  EMPLOYEE: 'employee',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const

export type UserRole = (typeof USERS_ROLES)[keyof typeof USERS_ROLES]

export const userRolesValues = Object.values(USERS_ROLES)
