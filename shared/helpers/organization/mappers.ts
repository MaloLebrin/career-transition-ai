import { OrganizationDto } from '#dtos/organization_dto.js'
import Organization from '#models/organization.js'

export function mapOrganization(org: Organization): OrganizationDto {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logoUrl: org.logoUrl ?? undefined,
    createdAt: org.createdAt.toISO() ?? '',
  }
}
