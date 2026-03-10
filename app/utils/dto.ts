import type { UserSessionDto } from '#dtos/auth_dto'
import type User from '#models/user'

export function toSessionDto(user: User): UserSessionDto {
  return {
    id: user.id,
    organizationId: user.organizationId,
    email: user.email,
    name: user.name,
    role: user.role,
  }
}
