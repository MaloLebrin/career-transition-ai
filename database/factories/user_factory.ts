import User from '#models/user'
import { type UserRole, userRolesValues } from '#shared/types/advisor/roles'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

export const UserFactory = factory
  .define(User, ({ faker }) => {
    return {
      organizationId: 0, // à surcharger dans les tests
      email: faker.internet.email().toLowerCase(),
      // En clair : hashé une seule fois par le hook de `withAuthFinder`.
      password: 'password',
      name: faker.person.fullName(),
      role: faker.helpers.arrayElement(userRolesValues) as UserRole,
      onboardingCompletedAt: DateTime.now(),
    }
  })
  .build()
