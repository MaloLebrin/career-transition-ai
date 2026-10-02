import type { UserSessionDto } from '#dtos/auth_dto'
import EmailAlreadyUsedException from '#exceptions/email_already_used_exception'
import InvalidCredentialsException from '#exceptions/invalid_credentials_exception'
import OrganizationNameAlreadyUsedException from '#exceptions/organization_name_already_used_exception'
import Employee from '#models/employee'
import Organization from '#models/organization'
import User from '#models/user'
import { EmailVerificationService } from '#services/email_verification_service'
import { EmailVerificationMailService } from '#services/mail/email_verification_mail_service'
import { MailService } from '#services/mail/mail_service'
import { OnboardingTokensService } from '#services/onboarding_tokens_service'
import { PlatformOrganizationService } from '#services/platform_organization_service'
import { ACCOUNT_TYPES } from '#shared/constants/b2c'
import { EMPLOYEES_STATUS } from '#shared/constants/employee'
import { TERMS_VERSION } from '#shared/constants/legal'
import { USERS_ROLES, type UserRole } from '#shared/types/advisor/roles'
import type { RegisterCandidateInput } from '#shared/types/auth/register_candidate'
import { toSessionDto } from '#utils/dto'
import { inject } from '@adonisjs/core'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

type RegisterInput = {
  email: string
  password: string
  name: string
  role: UserRole
  organizationName: string
}

type UpdateProfileInput = {
  name: string
  email: string
}

@inject()
export class AuthService {
  constructor(
    private platformOrganizationService: PlatformOrganizationService = new PlatformOrganizationService(),
    private emailVerification: EmailVerificationService = new EmailVerificationService(
      new EmailVerificationMailService(new MailService()),
      new OnboardingTokensService()
    )
  ) {}

  /**
   * Verifies user credentials and returns the user model.
   * Throws if credentials are invalid.
   */
  public async verifyCredentials(email: string, password: string): Promise<User> {
    const user = await User.findBy('email', email)
    if (!user) {
      throw new InvalidCredentialsException()
    }
    const isValid = await hash.verify(user.password, password)
    if (!isValid) {
      throw new InvalidCredentialsException()
    }
    return user
  }

  /**
   * Registers a new advisor (and creates its organization).
   * Throws if email or organization name is already used.
   */
  public async register(input: RegisterInput): Promise<UserSessionDto> {
    const existingUser = await User.findBy('email', input.email)
    if (existingUser) {
      throw new EmailAlreadyUsedException()
    }

    const existingOrg = await Organization.findBy('name', input.organizationName.trim())
    if (existingOrg) {
      throw new OrganizationNameAlreadyUsedException()
    }

    const trx = await db.transaction()
    try {
      const org = await Organization.create(
        { name: input.organizationName.trim() },
        { client: trx }
      )
      const user = await User.create(
        {
          organizationId: org.id,
          email: input.email,
          name: input.name,
          password: input.password,
          role: USERS_ROLES.ADVISOR,
          onboardingCompletedAt: DateTime.now(),
        },
        { client: trx }
      )
      await trx.commit()
      return toSessionDto(user)
    } catch (err) {
      await trx.rollback()
      throw err
    }
  }

  /**
   * Inscription d'un particulier (#93) : compte `employee` **et** fiche
   * candidat `b2c` dans l'organisation plateforme, sans conseiller. La fiche
   * reste `onboarded: false` : `checkOnboarding()` envoie le nouvel inscrit
   * vers l'onboarding existant. L'acceptation des CGU est horodatée avec la
   * version en vigueur. L'e-mail est unique sur toute la plateforme (login
   * global). Lance `PlatformOrganizationMissingError` (503) sans organisation
   * plateforme seedée. Le lien de vérification d'e-mail (#98) part après le
   * commit ; son échec n'annule pas l'inscription.
   */
  public async registerCandidate(input: RegisterCandidateInput): Promise<UserSessionDto> {
    const existingUser = await User.findBy('email', input.email)
    if (existingUser) {
      throw new EmailAlreadyUsedException()
    }

    const platformOrganizationId = await this.platformOrganizationService.getId()
    const name = input.name.trim()

    const user = await db.transaction(async (trx) => {
      const created = await User.create(
        {
          organizationId: platformOrganizationId,
          email: input.email,
          name,
          password: input.password,
          role: USERS_ROLES.EMPLOYEE,
          onboardingCompletedAt: DateTime.now(),
          termsAcceptedAt: DateTime.now(),
          termsVersion: TERMS_VERSION,
        },
        { client: trx }
      )
      await Employee.create(
        {
          organizationId: platformOrganizationId,
          advisorId: null,
          userId: created.id,
          name,
          email: input.email,
          currentRole: '',
          targetRole: null,
          summary: null,
          advisorNotes: null,
          status: EMPLOYEES_STATUS.ONBOARDING,
          onboarded: false,
          accountType: ACCOUNT_TYPES.B2C,
        },
        { client: trx }
      )
      return created
    })

    await this.emailVerification.sendLinkSafely(user)
    return { ...toSessionDto(user), accountType: ACCOUNT_TYPES.B2C }
  }

  /**
   * Updates the authenticated user's profile (name, email).
   */
  public async updateProfile(user: User, input: UpdateProfileInput): Promise<UserSessionDto> {
    if (input.email !== user.email) {
      const existing = await User.query()
        .where('email', input.email)
        .whereNot('id', '=', user.id)
        .first()

      if (existing) {
        throw new EmailAlreadyUsedException()
      }
    }

    user.merge({
      name: input.name,
      email: input.email,
    })
    await user.save()

    await user.refresh()
    return toSessionDto(user)
  }

  public toSession(user: User): UserSessionDto {
    return toSessionDto(user)
  }

  public async findUserById(id: number): Promise<User | null> {
    return User.find(id)
  }
}
