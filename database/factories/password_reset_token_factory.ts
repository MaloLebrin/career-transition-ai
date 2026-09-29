import PasswordResetToken, { PASSWORD_RESET_TOKEN_TTL_MINUTES } from '#models/password_reset_token'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import { randomBytes } from 'node:crypto'
import { UserFactory } from '#database/factories/user_factory'

/**
 * Même format que `PasswordResetToken.createForUser` : empreinte SHA-256 d'un
 * secret de 32 octets, 1 h. Le secret est exposé sur `plainToken` (sauf
 * `token` imposé via `merge`).
 */
export const PasswordResetTokenFactory = factory
  .define(PasswordResetToken, () => {
    return {
      userId: 0, // à surcharger (ou via `.with('user')`)
      expiresAt: DateTime.now().plus({ minutes: PASSWORD_RESET_TOKEN_TTL_MINUTES }),
      usedAt: null,
    }
  })
  .after('make', (_, token) => {
    if (token.token) return
    const plainToken = randomBytes(32).toString('hex')
    token.token = PasswordResetToken.hash(plainToken)
    token.plainToken = plainToken
  })
  .state('expired', (token) => {
    token.expiresAt = DateTime.now().minus({ minutes: 1 })
  })
  .state('used', (token) => {
    token.usedAt = DateTime.now().minus({ minutes: 5 })
  })
  .relation('user', () => UserFactory)
  .build()
