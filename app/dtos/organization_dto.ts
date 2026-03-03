export type AdvisorRoleDto = 'admin' | 'expert' | 'consultant'

export type OrganizationDto = {
  id: number
  name: string
  slug: string
  logoUrl?: string
  createdAt: string
}

export type AdvisorDto = {
  id: number
  organizationId: number
  email: string
  name: string
  role: AdvisorRoleDto
}
