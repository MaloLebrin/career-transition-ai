import type { AdvisorRoleDto } from '#dtos/organization_dto.js'

export type InviteAdvisorInput = {
  organizationId: number
  name: string
  email: string
  role: AdvisorRoleDto
}
