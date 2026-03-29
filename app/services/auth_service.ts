import type { UserSessionDto } from '#dtos/auth_dto'
import EmailAlreadyUsedException from '#exceptions/email_already_used_exception'
import InvalidCredentialsException from '#exceptions/invalid_credentials_exception'
import OrganizationNameAlreadyUsedException from '#exceptions/organization_name_already_used_exception'
import Organization from '#models/organization'
import User from '#models/user'
import { USERS_ROLES, type UserRole } from '#shared/types/advisor/roles'
import { toSessionDto } from '#utils/dto'
import { inject } from '@adonisjs/core'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'

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
   * Updates the authenticated user's profile (name, email).
   */
  public async updateProfile(user: User, input: UpdateProfileInput): Promise<UserSessionDto> {
    if (input.email !== user.email) {
      const existing = await User.query()
        .where('email', input.email)
        .whereNot('id', user.id)
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
