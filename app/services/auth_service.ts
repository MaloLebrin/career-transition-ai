import type { UserSessionDto } from '#dtos/auth_dto'
import Organization from '#models/organization'
import User, { USERS_ROLES, type UserRole } from '#models/user'
import { inject } from '@adonisjs/core'
import hash from '@adonisjs/core/services/hash'

type RegisterInput = {
  email: string
  password: string
  name: string
  role: UserRole
}

type UpdateProfileInput = {
  name: string
  email: string
}

function toSessionDto(user: User): UserSessionDto {
  return {
    id: user.id,
    organizationId: user.organizationId,
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
    // Même service que le modèle User (hash.make) : hash.verify détecte l'algo depuis le hash ($scrypt$…)
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

  /**
   * Updates the authenticated user's profile (name, email).
   */
  public async updateProfile(user: User, input: UpdateProfileInput): Promise<UserSessionDto> {
    if (input.email !== user.email) {
      const existing = await User.query()
        .where('email', input.email)
        .whereNot('id', user.id)
        .first()

      if (existing) {
        throw new Error('Cet email est déjà utilisé.')
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

  public async resetPasswordForUser(
    id: number
  ): Promise<{ user: User; temporaryPassword: string } | null> {
    const user = await User.find(id)
    if (!user) {
      return null
    }

    const temporaryPassword = Math.random().toString(36).slice(-10)
    user.password = temporaryPassword
    await user.save()

    return { user, temporaryPassword }
  }
}
