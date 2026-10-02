import Employee from '#models/employee'
import User from '#models/user'
import { PlatformOrganizationService } from '#services/platform_organization_service'
import { SuperAdminUsersService } from '#services/super_admin_users_service'
import { PLATFORM_TEAM_ROLES, type PlatformTeamRole } from '#shared/constants/roles'
import type {
  InvitePlatformMemberInput,
  PlatformTeamMember,
} from '#shared/types/expert_request/admin'
import { inject } from '@adonisjs/core'

/**
 * Équipe interne de l'organisation plateforme (#105) : les experts qu'un
 * super admin assigne aux particuliers. Rôles `PLATFORM_TEAM_ROLES` (jamais
 * `employee`, cf. #96, ni `super_admin`), hors comptes supprimés.
 */
@inject()
export class PlatformTeamService {
  constructor(
    private platformOrganization: PlatformOrganizationService,
    private users: SuperAdminUsersService
  ) {}

  public async listMembers(): Promise<PlatformTeamMember[]> {
    const platformId = await this.platformOrganization.getId()
    const members = await User.query()
      .where('organizationId', platformId)
      .whereIn('role', [...PLATFORM_TEAM_ROLES])
      .whereNull('deletedAt')
      .orderBy('name', 'asc')
      .select('id', 'name', 'email', 'role', 'onboardingCompletedAt')
    if (members.length === 0) return []

    const counts = await Employee.query()
      .whereIn(
        'advisorId',
        members.map((member) => member.id)
      )
      .whereNull('deletedAt')
      .groupBy('advisorId')
      .select('advisorId')
      .count('* as total')
    const countByExpert = new Map(
      counts.map((row) => [Number(row.advisorId), Number(row.$extras.total ?? 0)])
    )

    return members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role as PlatformTeamRole,
      onboardingCompleted: member.onboardingCompletedAt !== null,
      assignedCandidatesCount: countByExpert.get(member.id) ?? 0,
    }))
  }

  /** Membre de l'équipe interne assignable comme expert, ou `null`. */
  public async findEligibleExpert(userId: number): Promise<User | null> {
    const platformId = await this.platformOrganization.getId()
    return User.query()
      .where('id', userId)
      .where('organizationId', platformId)
      .whereIn('role', [...PLATFORM_TEAM_ROLES])
      .whereNull('deletedAt')
      .first()
  }

  /** Invitation d'un membre interne : même parcours d'activation que les cabinets. */
  public async invite(input: InvitePlatformMemberInput): Promise<User> {
    const platformId = await this.platformOrganization.getId()
    return this.users.createUserWithInvite({
      organizationId: platformId,
      name: input.name,
      email: input.email,
      role: input.role,
      platformOrganizationId: platformId,
      allowPlatformOrganization: true,
    })
  }
}
