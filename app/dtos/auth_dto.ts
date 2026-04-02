import type { UserRole } from '#shared/types/advisor/roles'

export type UserSessionDto = {
  id: number
  organizationId: number
  email: string
  name: string
  role: UserRole
}
