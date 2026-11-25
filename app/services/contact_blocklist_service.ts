import { ContactRequestNotFoundError } from '#exceptions/contact_request_errors'
import BlockedContactEmail from '#models/blocked_contact_email'
import ContactRequest from '#models/contact_request'
import User from '#models/user'
import { PlatformOrganizationService } from '#services/platform_organization_service'
import { CONTACT_REQUEST_STATUSES } from '#shared/constants/contact_request'
import {
  canDisableSenderAccount,
  normalizeContactEmail,
} from '#shared/helpers/contact_request/sender_account'
import type { ContactRequestSenderState } from '#shared/types/contact_request/admin'
import { inject } from '@adonisjs/core'

/**
 * Adresses bloquées pour le formulaire de contact public et rapprochement d'une demande avec
 * le compte qui porte la même adresse (boîte des demandes du super admin).
 */
@inject()
export class ContactBlocklistService {
  constructor(
    private platformOrganizationService: PlatformOrganizationService = new PlatformOrganizationService()
  ) {}

  /** Demande par id ; inconnue → 404. */
  public async findRequest(contactRequestId: number): Promise<ContactRequest> {
    const contactRequest = await ContactRequest.find(contactRequestId)
    if (!contactRequest) throw new ContactRequestNotFoundError()
    return contactRequest
  }

  /** L'adresse est-elle bloquée ? Comparaison sans casse ni espaces. */
  public async isBlocked(email: string): Promise<boolean> {
    const blocked = await BlockedContactEmail.query()
      .where('email', normalizeContactEmail(email))
      .first()
    return blocked !== null
  }

  /**
   * Bloque l'adresse de la demande (sans effet si elle l'est déjà) et archive ses demandes
   * encore à traiter : elles n'appellent plus de réponse.
   */
  public async blockSender(actor: User, contactRequestId: number): Promise<ContactRequest> {
    const contactRequest = await this.findRequest(contactRequestId)
    const email = normalizeContactEmail(contactRequest.email)

    await BlockedContactEmail.firstOrCreate({ email }, { blockedByUserId: actor.id })
    await ContactRequest.query()
      .whereRaw('LOWER(email) = ?', [email])
      .where('status', CONTACT_REQUEST_STATUSES.PENDING)
      .update({ status: CONTACT_REQUEST_STATUSES.ARCHIVED })

    return contactRequest
  }

  /** Lève le blocage de l'adresse de la demande (sans effet si elle n'est pas bloquée). */
  public async unblockSender(contactRequestId: number): Promise<ContactRequest> {
    const contactRequest = await this.findRequest(contactRequestId)
    await BlockedContactEmail.query()
      .where('email', normalizeContactEmail(contactRequest.email))
      .delete()
    return contactRequest
  }

  /**
   * État de l'expéditeur pour chaque adresse d'une page de demandes, en deux requêtes
   * groupées. La clé de la table est l'adresse normalisée (`normalizeContactEmail`).
   */
  public async senderStates(
    emails: string[],
    actorId: number
  ): Promise<Map<string, ContactRequestSenderState>> {
    const normalized = [...new Set(emails.map(normalizeContactEmail))]
    const states = new Map<string, ContactRequestSenderState>()
    if (normalized.length === 0) return states

    const [blocked, accounts] = await Promise.all([
      BlockedContactEmail.query().whereIn('email', normalized).select('email'),
      User.query()
        .whereRaw('LOWER(email) = ANY(?)', [normalized])
        .select('id', 'name', 'email', 'role', 'organizationId', 'disabledAt'),
    ])
    const blockedEmails = new Set(blocked.map((row) => row.email))
    const platformOrganizationId =
      accounts.length > 0 ? await this.platformOrganizationService.getId() : null

    for (const email of normalized) {
      const account = accounts.find((user) => normalizeContactEmail(user.email) === email)
      states.set(email, {
        senderBlocked: blockedEmails.has(email),
        account:
          account && platformOrganizationId !== null
            ? {
                id: account.id,
                name: account.name,
                role: account.role,
                disabled: account.disabledAt !== null,
                canDisable: canDisableSenderAccount(actorId, platformOrganizationId, account),
              }
            : null,
      })
    }
    return states
  }
}
