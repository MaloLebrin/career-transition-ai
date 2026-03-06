import type { UserRole } from '#models/user'

export type UserSessionDto = {
  id: number
  organizationId: number
  email: string
  name: string
  role: UserRole
}
