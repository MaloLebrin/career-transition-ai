import { AdvisorDto } from '#dtos/organization_dto'
import OnboardingToken from '#models/onboarding_token'
import Organization from '#models/organization'
import User from '#models/user'
import { OnboardingMailService } from '#services/onboarding_mail_service'
import { userToAdvisorDto } from '#shared/helpers/advisor/mappers'
import type { InviteAdvisorInput } from '#shared/types/advisor/invite_advisor'
import { inject } from '@adonisjs/core'
import hash from '@adonisjs/core/services/hash'
import { randomBytes } from 'node:crypto'

@inject()
export class AdvisorService {
  constructor(private onboardingMailService: OnboardingMailService) {}

  public async inviteAdvisor(input: InviteAdvisorInput, baseUrl: string): Promise<AdvisorDto> {
    if (!baseUrl) {
      throw new Error('baseUrl is required')
    }

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

    const token = await OnboardingToken.createForUser(user.id)
    const organization = await Organization.findOrFail(input.organizationId)

    await this.onboardingMailService.sendInviteAdvisorLink({
      user,
      organization,
      token,
      baseUrl,
    })
    return userToAdvisorDto(user)
  }
}
