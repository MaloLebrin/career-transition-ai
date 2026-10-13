import type { AdvisorDto } from '#dtos/organization_dto.js'
import type User from '#models/user.js'

export function userToAdvisorDto(user: User): AdvisorDto {
  return {
    id: user.id,
    organizationId: user.organizationId,
    email: user.email,
    name: user.name,
    role: user.role,
    disabledAt: user.disabledAt ? user.disabledAt.toISO() : null,
  }
}
