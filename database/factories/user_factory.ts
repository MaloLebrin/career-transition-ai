import User, { UserRole, userRolesValues } from '#models/user'
import hash from '@adonisjs/core/services/hash'
import factory from '@adonisjs/lucid/factories'

export const UserFactory = factory
  .define(User, async ({ faker }) => {
    return {
      organizationId: 0, // à surcharger dans les tests
      email: faker.internet.email().toLowerCase(),
      password: await hash.make('password'),
      name: faker.person.fullName(),
      role: faker.helpers.arrayElement(userRolesValues) as UserRole,
    }
  })
  .build()
