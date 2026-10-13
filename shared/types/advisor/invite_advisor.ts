import type { OrganizationTeamRole } from '#shared/constants/organisation'

export type InviteAdvisorInput = {
  organizationId: number
  name: string
  email: string
  role: OrganizationTeamRole
}
