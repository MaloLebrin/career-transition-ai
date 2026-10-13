import {
  AdvisorLicenseLimitReachedError,
  TeamMemberLockedError,
  TeamMemberNotFoundError,
  TeamReassignTargetInvalidError,
} from '#exceptions/team_errors'
import Employee from '#models/employee'
import Organization from '#models/organization'
import User from '#models/user'
import {
  LICENSED_ADVISOR_ROLES,
  MAX_LICENSES_ADVISORS,
  type OrganizationTeamRole,
} from '#shared/constants/organisation'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { DateTime } from 'luxon'

/**
 * Gestion de l'équipe d'un cabinet par son administrateur (#71) : rôle,
 * désactivation, réassignation des candidats, licences conseiller.
 *
 * Toutes les lectures sont bornées à l'organisation de l'administrateur
 * (membre d'un autre cabinet → 404). L'organisation plateforme n'a pas de
 * limite de licences : son équipe est gérée par le super admin.
 */
export class TeamMembersService {
  /** Licences conseiller occupées : comptes admin / conseiller non désactivés (invitations en attente comprises). */
  public async countAdvisorSeats(organizationId: number): Promise<number> {
    const row = await User.query()
      .where('organizationId', organizationId)
      .whereIn('role', [...LICENSED_ADVISOR_ROLES])
      .whereNull('disabledAt')
      .count('* as total')
      .first()
    return Number(row?.$extras.total ?? 0)
  }

  /** Refuse une nouvelle licence au-delà de `MAX_LICENSES_ADVISORS` (hors organisation plateforme). */
  public async assertAdvisorSeatAvailable(organizationId: number): Promise<void> {
    const organization = await Organization.find(organizationId)
    if (organization?.isPlatform) return
    if ((await this.countAdvisorSeats(organizationId)) >= MAX_LICENSES_ADVISORS) {
      throw new AdvisorLicenseLimitReachedError(MAX_LICENSES_ADVISORS)
    }
  }

  public async changeRole(
    actor: User,
    memberId: number,
    role: OrganizationTeamRole
  ): Promise<User> {
    const member = await this.findMember(actor, memberId)
    this.assertNotSelf(actor, member)
    if (member.role === role) return member

    if (member.role === USERS_ROLES.ADMIN) await this.assertNotLastAdmin(member)
    // Un membre désactivé change de rôle sans occuper de licence.
    member.role = role
    await member.save()
    return member
  }

  /** Désactive (accès coupé, données conservées) ou réactive un membre ; la réactivation reprend une licence. */
  public async setDisabled(actor: User, memberId: number, disabled: boolean): Promise<User> {
    const member = await this.findMember(actor, memberId)
    this.assertNotSelf(actor, member)

    if (disabled) {
      if (member.disabledAt) return member
      if (member.role === USERS_ROLES.ADMIN) await this.assertNotLastAdmin(member)
      member.disabledAt = DateTime.now()
    } else {
      if (!member.disabledAt) return member
      if (LICENSED_ADVISOR_ROLES.includes(member.role)) {
        await this.assertAdvisorSeatAvailable(member.organizationId)
      }
      member.disabledAt = null
    }
    await member.save()
    return member
  }

  /** Confie tous les candidats d'un membre à un autre membre actif du cabinet. Retourne le nombre de fiches déplacées. */
  public async reassignCandidates(
    actor: User,
    fromMemberId: number,
    toMemberId: number
  ): Promise<number> {
    const from = await this.findMember(actor, fromMemberId)
    if (toMemberId === from.id) throw new TeamReassignTargetInvalidError()
    const to = await User.query()
      .where('id', toMemberId)
      .where('organizationId', actor.organizationId)
      .whereIn('role', [USERS_ROLES.ADMIN, USERS_ROLES.ADVISOR, USERS_ROLES.EXPERT])
      .whereNull('disabledAt')
      .first()
    if (!to) throw new TeamReassignTargetInvalidError()

    const updated = await Employee.query()
      .where('organizationId', actor.organizationId)
      .where('advisorId', from.id)
      .update({ advisorId: to.id })
    return Number(updated[0] ?? 0)
  }

  private async findMember(actor: User, memberId: number): Promise<User> {
    const member = await User.query()
      .where('id', memberId)
      .where('organizationId', actor.organizationId)
      .whereIn('role', [USERS_ROLES.ADMIN, USERS_ROLES.ADVISOR, USERS_ROLES.EXPERT])
      .first()
    if (!member) throw new TeamMemberNotFoundError()
    return member
  }

  private assertNotSelf(actor: User, member: User): void {
    if (actor.id === member.id) throw new TeamMemberLockedError()
  }

  private async assertNotLastAdmin(member: User): Promise<void> {
    const other = await User.query()
      .where('organizationId', member.organizationId)
      .where('role', USERS_ROLES.ADMIN)
      .whereNull('disabledAt')
      .whereNot('id', member.id)
      .first()
    if (!other) throw new TeamMemberLockedError()
  }
}
