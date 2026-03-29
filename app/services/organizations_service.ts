import type { AdvisorDto, OrganizationDto } from '#dtos/organization_dto'
import Organization from '#models/organization'
import User from '#models/user'
import { USERS_ROLES } from '#shared/constants/user'
import { userToAdvisorDto } from '#shared/helpers/advisor/mappers.js'
import { mapOrganization } from '#shared/helpers/organization/mappers.js'

type UpdateOrganizationInput = {
  name?: string
  slug?: string
  logoUrl?: string
}

export class OrganizationsService {
  public async getById(id: number): Promise<OrganizationDto | null> {
    const org = await Organization.find(id)
    return org ? mapOrganization(org) : null
  }

  public async update(org: Organization, input: UpdateOrganizationInput): Promise<OrganizationDto> {
    org.merge({
      name: input.name ?? org.name,
      slug: input.slug ?? org.slug,
      logoUrl: input.logoUrl !== undefined ? input.logoUrl : org.logoUrl,
    })
    await org.save()
    return mapOrganization(org)
  }

  public async listAdvisors(organizationId: number): Promise<AdvisorDto[]> {
    const users = await User.query()
      .where('organizationId', organizationId)
      .whereIn('role', [USERS_ROLES.ADVISOR, USERS_ROLES.ADMIN])
    return users.map(userToAdvisorDto)
  }
}
