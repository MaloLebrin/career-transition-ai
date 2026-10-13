import DomainException from '#exceptions/domain_exception'
import EmailAlreadyUsedException from '#exceptions/email_already_used_exception'
import {
  SuperAdminRoleLockedError,
  SuperAdminUserNotFoundError,
} from '#exceptions/super_admin_user_errors'
import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import { OnboardingMailService } from '#services/onboarding_mail_service'
import { PlatformOrganizationService } from '#services/platform_organization_service'
import type { SuperAdminCreatableRole } from '#shared/constants/roles'
import { LIST_PAGE_SIZE } from '#shared/constants/pagination'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import type { Paginated } from '#shared/types/pagination'
import type { UserListItem, UserListParams } from '#shared/types/super_admin/lists'
import { containsPattern, paginationMeta } from '#utils/pagination'
import { inject } from '@adonisjs/core'
import { randomBytes } from 'node:crypto'

type CreatePlatformUserInput = {
  organizationId: number
  name: string
  email: string
  role: SuperAdminCreatableRole
  /** Organisation plateforme du super admin : interdite comme cible de création… */
  platformOrganizationId: number
  /** …sauf pour l'équipe interne (`PlatformTeamService.invite`, #105). */
  allowPlatformOrganization?: boolean
}

@inject()
export class SuperAdminUsersService {
  constructor(
    private onboardingMailService: OnboardingMailService,
    private platformOrganizationService: PlatformOrganizationService = new PlatformOrganizationService()
  ) {}

  /**
   * Une page des utilisateurs des organisations clientes (hors organisation plateforme).
   * Recherche par nom, e-mail ou nom du cabinet ; filtre de rôle côté base.
   */
  public async list(
    platformOrganizationId: number,
    params: UserListParams
  ): Promise<Paginated<UserListItem>> {
    const query = User.query()
      .where('organizationId', '!=', platformOrganizationId)
      .preload('organization', (q) => q.select('id', 'name'))
      .if(params.role !== null, (q) => q.where('role', params.role!))
      .orderBy([
        { column: 'name', order: 'asc' },
        { column: 'id', order: 'asc' },
      ])
    if (params.search) {
      const pattern = containsPattern(params.search)
      query.where((builder) => {
        builder
          .whereILike('name', pattern)
          .orWhereILike('email', pattern)
          .orWhereHas('organization', (org) => org.whereILike('name', pattern))
      })
    }

    const paginator = await query.paginate(params.page, LIST_PAGE_SIZE)
    return {
      items: paginator.all().map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization
          ? { id: user.organization.id, name: user.organization.name }
          : null,
        createdAt: user.createdAt?.toISO() ?? null,
        onboardingCompleted: user.onboardingCompletedAt !== null,
      })),
      pagination: paginationMeta(paginator, LIST_PAGE_SIZE),
    }
  }

  /**
   * Indique si le compte utilisateur est activé (`users.onboarding_completed_at` renseigné).
   */
  public static async hasCompletedOnboarding(userId: number): Promise<boolean> {
    const user = await User.query().where('id', userId).select('onboardingCompletedAt').first()
    return user?.onboardingCompletedAt !== null
  }

  public async createUserWithInvite(input: CreatePlatformUserInput): Promise<User> {
    if (input.organizationId === input.platformOrganizationId && !input.allowPlatformOrganization) {
      throw new DomainException('Vous ne pouvez pas créer d’utilisateur dans cette organisation.', {
        status: 403,
      })
    }

    const email = input.email.trim()
    const name = input.name.trim()

    const existing = await User.query()
      .where('organizationId', input.organizationId)
      .whereRaw('LOWER(email) = ?', [email.toLowerCase()])
      .first()

    if (existing) {
      throw new EmailAlreadyUsedException()
    }

    const temporaryPassword = randomBytes(32).toString('hex')
    const user = await User.create({
      organizationId: input.organizationId,
      email,
      name,
      password: temporaryPassword,
      role: input.role,
    })

    const token = await OnboardingToken.createForUser(user.id)
    await this.onboardingMailService.sendSetPasswordLink({
      user,
      token,
    })

    return user
  }

  /**
   * Nouveau token + email. Refuse si l’utilisateur a déjà consommé un token.
   * Révoque les tokens non utilisés existants pour ce user.
   */
  public async resendOnboardingInvitation(user: User): Promise<void> {
    const completed = await SuperAdminUsersService.hasCompletedOnboarding(user.id)
    if (completed) {
      throw new DomainException('Cet utilisateur a déjà activé son compte.', { status: 400 })
    }

    await OnboardingToken.query().where('userId', user.id).whereNull('usedAt').delete()

    const token = await OnboardingToken.createForUser(user.id)
    await this.onboardingMailService.sendSetPasswordLink({
      user,
      token,
    })
  }

  /**
   * Change le rôle d’un utilisateur d’une organisation cliente.
   *
   * Hors périmètre (inexistant ou compte de l’organisation plateforme, #92) → 404 ;
   * son propre compte ou un autre super admin → 422.
   * `super_admin` n’est jamais attribuable (`updateUserRoleValidator`).
   */
  public async updateRole(
    actor: User,
    userId: number,
    role: SuperAdminCreatableRole
  ): Promise<User> {
    const platformOrganizationId = await this.platformOrganizationService.getId()
    const user = await User.query()
      .where('id', userId)
      .where('organizationId', '!=', platformOrganizationId)
      .first()
    if (!user) {
      throw new SuperAdminUserNotFoundError()
    }
    if (user.id === actor.id || user.role === USERS_ROLES.SUPER_ADMIN) {
      throw new SuperAdminRoleLockedError()
    }

    user.role = role
    await user.save()
    return user
  }
}
