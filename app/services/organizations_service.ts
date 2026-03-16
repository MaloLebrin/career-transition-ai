import hash from '@adonisjs/core/services/hash'
import type { AdvisorDto, AdvisorRoleDto, OrganizationDto } from '#dtos/organization_dto'
import Organization from '#models/organization'
import User from '#models/user'
import { USERS_ROLES } from '#shared/constants/user'
import { randomBytes } from 'node:crypto'

function mapOrganization(org: Organization): OrganizationDto {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logoUrl: org.logoUrl ?? undefined,
    createdAt: org.createdAt.toISO() ?? '',
  }
}

function userToAdvisorDto(user: User): AdvisorDto {
  const role: AdvisorRoleDto = user.role === 'admin' ? 'admin' : 'expert'
  return {
    id: user.id,
    organizationId: user.organizationId,
    email: user.email,
    name: user.name,
    role,
  }
}

type UpdateOrganizationInput = {
  name?: string
  slug?: string
  logoUrl?: string
}

type InviteAdvisorInput = {
  organizationId: number
  name: string
  email: string
  role: AdvisorRoleDto
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

  public async inviteAdvisor(input: InviteAdvisorInput): Promise<AdvisorDto> {
    const existing = await User.query()
      .where('organizationId', input.organizationId)
      .whereRaw('LOWER(email) = ?', [input.email.toLowerCase()])
      .first()
    if (existing) {
      throw new Error('Cet email est déjà utilisé par un compte existant.')
    }

    const backendRole = input.role === 'admin' ? 'admin' : 'advisor'
    const tempPassword = randomBytes(32).toString('hex')
    const user = await User.create({
      organizationId: input.organizationId,
      email: input.email,
      name: input.name,
      password: await hash.make(tempPassword),
      role: backendRole,
    })
    return userToAdvisorDto(user)
  }
}
