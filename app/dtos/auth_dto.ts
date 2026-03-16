import { UserRole } from '#shared/constants/user'

export type UserSessionDto = {
  id: number
  organizationId: number
  email: string
  name: string
  role: UserRole
}
