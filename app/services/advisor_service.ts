import { AdvisorDto } from '#dtos/organization_dto'
import User from '#models/user'
import { userToAdvisorDto } from '#shared/helpers/advisor/mappers.js'
import type { InviteAdvisorInput } from '#shared/types/advisor/invite_advisor'
import hash from '@adonisjs/core/services/hash'
import { randomBytes } from 'node:crypto'

export class AdvisorService {
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
