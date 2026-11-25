import BlockedContactEmail from '#models/blocked_contact_email'
import factory from '@adonisjs/lucid/factories'

export const BlockedContactEmailFactory = factory
  .define(BlockedContactEmail, ({ faker }) => {
    return {
      email: faker.internet.email().toLowerCase(),
      blockedByUserId: null,
    }
  })
  .build()
