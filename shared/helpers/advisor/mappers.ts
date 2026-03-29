import { AdvisorDto, AdvisorRoleDto } from '#dtos/organization_dto.js'
import User from '#models/user.js'

export function userToAdvisorDto(user: User): AdvisorDto {
  const role: AdvisorRoleDto = user.role === 'admin' ? 'admin' : 'expert'
  return {
    id: user.id,
    organizationId: user.organizationId,
    email: user.email,
    name: user.name,
    role,
  }
}
