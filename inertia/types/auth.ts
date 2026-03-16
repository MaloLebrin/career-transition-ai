import type { UserRole } from '#shared/constants/user'

export interface UserSession {
  id: number
  organizationId: number
  email: string
  name: string
  role: UserRole
}
