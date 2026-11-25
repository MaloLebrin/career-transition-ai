import BlockedContactEmail from '#models/blocked_contact_email'
import ContactRequest, {
  CONTACT_REQUEST_STATUSES,
  CONTACT_REQUEST_TYPES,
} from '#models/contact_request'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

/** Adresse de démo bloquée, avec la demande archivée qui a motivé le blocage. */
export const DEMO_BLOCKED_CONTACT_EMAIL = 'spam@demo-bloque.test'

export default class BlockedContactEmailSeeder extends BaseSeeder {
  async run() {
    await BlockedContactEmail.firstOrCreate({ email: DEMO_BLOCKED_CONTACT_EMAIL })
    await ContactRequest.firstOrCreate(
      { email: DEMO_BLOCKED_CONTACT_EMAIL },
      {
        name: 'Expéditeur indésirable',
        organization: null,
        phone: null,
        message: 'Message publicitaire répété, sans rapport avec la plateforme.',
        type: CONTACT_REQUEST_TYPES.CONTACT,
        status: CONTACT_REQUEST_STATUSES.ARCHIVED,
      }
    )
  }
}
