export type AdvisorRoleDto = 'admin' | 'expert' | 'consultant'

export type OrganizationDto = {
  id: string
  name: string
  slug: string
  logoUrl?: string
  createdAt: string
}

export type AdvisorDto = {
  id: string
  organizationId: string
  email: string
  name: string
  role: AdvisorRoleDto
}
