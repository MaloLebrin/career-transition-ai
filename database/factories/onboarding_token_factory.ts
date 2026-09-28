import OnboardingToken from '#models/onboarding_token'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import { UserFactory } from '#database/factories/user_factory'

/** Même format que `OnboardingToken.createForUser` : 32 octets en hexadécimal, 7 jours. */
export const OnboardingTokenFactory = factory
  .define(OnboardingToken, ({ faker }) => {
    return {
      userId: 0, // à surcharger (ou via `.with('user')`)
      token: faker.string.hexadecimal({ length: 64, casing: 'lower', prefix: '' }),
      expiresAt: DateTime.now().plus({ days: 7 }),
      usedAt: null,
    }
  })
  .state('expired', (token) => {
    token.expiresAt = DateTime.now().minus({ days: 1 })
  })
  .state('used', (token) => {
    token.usedAt = DateTime.now().minus({ hours: 1 })
  })
  .relation('user', () => UserFactory)
  .build()
