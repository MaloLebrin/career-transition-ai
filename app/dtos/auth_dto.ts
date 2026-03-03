import type { UserRole } from '#models/user'

export type UserSessionDto = {
  id: string
  organizationId: string
  email: string
  name: string
  role: UserRole
}

