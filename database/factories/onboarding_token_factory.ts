import OnboardingToken from '#models/onboarding_token'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import { randomBytes } from 'node:crypto'
import { UserFactory } from '#database/factories/user_factory'

/**
 * Même format que `OnboardingToken.createForUser` : empreinte SHA-256 d'un secret
 * de 32 octets, 7 jours. Le secret est exposé sur `plainToken` (sauf `token`
 * imposé via `merge`).
 */
export const OnboardingTokenFactory = factory
  .define(OnboardingToken, () => {
    return {
      userId: 0, // à surcharger (ou via `.with('user')`)
      expiresAt: DateTime.now().plus({ days: 7 }),
      usedAt: null,
    }
  })
  .after('make', (_, token) => {
    if (token.token) return
    const plainToken = randomBytes(32).toString('hex')
    token.token = OnboardingToken.hash(plainToken)
    token.plainToken = plainToken
  })
  .state('expired', (token) => {
    token.expiresAt = DateTime.now().minus({ days: 1 })
  })
  .state('used', (token) => {
    token.usedAt = DateTime.now().minus({ hours: 1 })
  })
  .relation('user', () => UserFactory)
  .build()
