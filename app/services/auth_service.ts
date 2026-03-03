import hash from '@adonisjs/core/services/hash'
import { inject } from '@adonisjs/core'
import type { UserSessionDto } from '#dtos/auth_dto'
import Organization from '#models/organization'
import User, { USERS_ROLES, type UserRole } from '#models/user'

type RegisterInput = {
  email: string
  password: string
  name: string
  role: UserRole
}

function toSessionDto(user: User): UserSessionDto {
  return {
    id: String(user.id),
    organizationId: String(user.organizationId),
    email: user.email,
    name: user.name,
    role: user.role,
  }
}

@inject()
export class AuthService {
  /**
   * Verifies user credentials and returns the user model.
   * Throws if credentials are invalid.
   */
  public async verifyCredentials(email: string, password: string): Promise<User> {
    const user = await User.findBy('email', email)
    if (!user) {
      throw new Error('Identifiants invalides')
    }
    const isValid = await hash.verify(user.password, password)
    if (!isValid) {
      throw new Error('Identifiants invalides')
    }
    return user
  }

  /**
   * Registers a new user for the default demo organization (ftc-paris).
   * This keeps the demo behaviour while persisting users properly.
   */
  public async register(input: RegisterInput): Promise<UserSessionDto> {
    const existing = await User.findBy('email', input.email)
    if (existing) {
      throw new Error('Cet email est déjà utilisé.')
    }

    // Find or create the default demo organization
    let org = await Organization.findBy('slug', 'ftc-paris')
    if (!org) {
      org = await Organization.create({
        name: 'France Transition Carrière Paris',
        slug: 'ftc-paris',
      })
    }

    const role: UserRole =
      input.role === USERS_ROLES.ADVISOR || input.role === USERS_ROLES.EMPLOYEE
        ? input.role
        : USERS_ROLES.ADVISOR

    const user = await User.create({
      organizationId: org.id,
      email: input.email,
      name: input.name,
      password: input.password,
      role,
    })

    return toSessionDto(user)
  }

  public toSession(user: User): UserSessionDto {
    return toSessionDto(user)
  }
}

