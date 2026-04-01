import EmailAlreadyUsedException from '#exceptions/email_already_used_exception'
import OrganizationNameAlreadyUsedException from '#exceptions/organization_name_already_used_exception'
import OnboardingToken from '#models/onboarding_token'
import Organization from '#models/organization'
import User from '#models/user'
import { OnboardingMailService } from '#services/onboarding_mail_service'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'

type CreateOrganizationWithOwnerInput = {
  organizationName: string
  organizationSlug?: string
  ownerName: string
  ownerEmail: string
  baseUrl: string
}

@inject()
export class SuperAdminOrganizationsService {
  constructor(private onboardingMailService: OnboardingMailService) {}

  public async createOrganizationWithOwner(input: CreateOrganizationWithOwnerInput): Promise<{
    organization: Organization
    owner: User
    token: OnboardingToken
  }> {
    const organizationName = input.organizationName.trim()
    const ownerName = input.ownerName.trim()
    const ownerEmail = input.ownerEmail.trim()

    const existingUser = await User.query().whereRaw('LOWER(email) = ?', [ownerEmail.toLowerCase()]).first()
    if (existingUser) {
      throw new EmailAlreadyUsedException()
    }

    const existingOrg = await Organization.findBy('name', organizationName)
    if (existingOrg) {
      throw new OrganizationNameAlreadyUsedException()
    }

    const trx = await db.transaction()
    let organization!: Organization
    let owner!: User
    let token!: OnboardingToken

    try {
      organization = await Organization.create(
        {
          name: organizationName,
          slug: input.organizationSlug?.trim() || undefined,
        },
        { client: trx }
      )

      const temporaryPassword = crypto.randomBytes(32).toString('hex')
      owner = await User.create(
        {
          organizationId: organization.id,
          email: ownerEmail,
          name: ownerName,
          password: temporaryPassword,
          role: USERS_ROLES.ADMIN,
        },
        { client: trx }
      )

      token = await OnboardingToken.create(
        {
          userId: owner.id,
          token: crypto.randomBytes(32).toString('hex'),
          expiresAt: DateTime.now().plus({ days: 7 }),
          usedAt: null,
        },
        { client: trx }
      )

      await trx.commit()
    } catch (err) {
      await trx.rollback()
      throw err
    }

    await this.onboardingMailService.sendSetPasswordLink({
      user: owner,
      token,
      baseUrl: input.baseUrl,
    })

    return { organization, owner, token }
  }
}

