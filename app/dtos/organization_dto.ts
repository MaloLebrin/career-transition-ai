import type { UserRole } from '#shared/types/advisor/roles'

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
  role: UserRole
  /** ISO, `null` tant que le compte est actif. */
  disabledAt: string | null
}
