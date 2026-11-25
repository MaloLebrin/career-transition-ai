import { ContactRequestNotFoundError } from '#exceptions/contact_request_errors'
import BlockedContactEmail from '#models/blocked_contact_email'
import ContactRequest from '#models/contact_request'
import User from '#models/user'
import { PlatformOrganizationService } from '#services/platform_organization_service'
import { CONTACT_REQUEST_STATUSES } from '#shared/constants/contact_request'
import { LIST_PAGE_SIZE } from '#shared/constants/pagination'
import {
  canDisableSenderAccount,
  normalizeContactEmail,
} from '#shared/helpers/contact_request/sender_account'
import type {
  BlockedContactEmailItem,
  ContactRequestSenderState,
} from '#shared/types/contact_request/admin'
import type { ListParams, Paginated } from '#shared/types/pagination'
import { paginationMeta, whereAnyColumnContains } from '#utils/pagination'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import type { DateTime } from 'luxon'

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
   * encore à traiter : elles n'appellent plus de réponse. Une seule transaction, et une
   * insertion qui ignore le doublon : deux blocages simultanés ne se heurtent pas.
   */
  public async blockSender(actor: User, contactRequestId: number): Promise<ContactRequest> {
    const contactRequest = await this.findRequest(contactRequestId)
    const email = normalizeContactEmail(contactRequest.email)

    await db.transaction(async (trx) => {
      await trx
        .insertQuery()
        .table(BlockedContactEmail.table)
        .insert({ email, blocked_by_user_id: actor.id })
        .onConflict('email')
        .ignore()
      await ContactRequest.query({ client: trx })
        .whereRaw('LOWER(email) = ?', [email])
        .where('status', CONTACT_REQUEST_STATUSES.PENDING)
        .update({ status: CONTACT_REQUEST_STATUSES.ARCHIVED })
    })

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
   * Lève un blocage par son id (liste des adresses bloquées) : ne dépend d'aucune demande, qui
   * peut avoir disparu. Retourne l'adresse, ou `null` si le blocage n'existe plus.
   */
  public async unblockById(blockedEmailId: number): Promise<string | null> {
    const blocked = await BlockedContactEmail.find(blockedEmailId)
    if (!blocked) return null
    await blocked.delete()
    return blocked.email
  }

  /** Une page des adresses bloquées, les plus récentes d'abord, recherche par adresse. */
  public async listBlocked(params: ListParams): Promise<Paginated<BlockedContactEmailItem>> {
    const query = BlockedContactEmail.query().orderBy('created_at', 'desc').orderBy('id', 'desc')
    whereAnyColumnContains(query, ['email'], params.search)

    const paginator = await query.paginate(params.page, LIST_PAGE_SIZE)
    return {
      items: paginator.all().map((row) => ({
        id: row.id,
        email: row.email,
        blockedAt: row.createdAt.toISO()!,
      })),
      pagination: paginationMeta(paginator, LIST_PAGE_SIZE),
    }
  }

  /** Lève les blocages posés avant `before` (durée de conservation). Retourne leur nombre. */
  public async purgeExpired(before: DateTime): Promise<number> {
    const deleted = await BlockedContactEmail.query()
      .where('created_at', '<', before.toSQL()!)
      .delete()
    return Number(deleted[0] ?? 0)
  }

  /**
   * État de l'expéditeur pour chaque adresse d'une page de demandes, en deux requêtes
   * groupées. La clé de la table est l'adresse normalisée (`normalizeContactEmail`). L'unicité
   * des e-mails de `users` tient compte de la casse et de l'organisation : si plusieurs comptes
   * portent l'adresse, aucun n'est proposé (`ambiguousAccount`).
   */
  public async senderStates(
    emails: string[],
    actorId: number
  ): Promise<Map<string, ContactRequestSenderState>> {
    const normalized = [...new Set(emails.map(normalizeContactEmail))]
    if (normalized.length === 0) return new Map()

    const [blocked, accounts] = await Promise.all([
      BlockedContactEmail.query().whereIn('email', normalized).select('email'),
      User.query()
        .whereRaw('LOWER(email) = ANY(?)', [normalized])
        .select('id', 'name', 'email', 'role', 'organizationId', 'disabledAt'),
    ])
    const blockedEmails = new Set(blocked.map((row) => row.email))
    const accountsByEmail = Map.groupBy(accounts, (user) => normalizeContactEmail(user.email))
    const platformOrganizationId =
      accounts.length > 0 ? await this.platformOrganizationService.getId() : null

    return new Map(
      normalized.map((email) => {
        const matches = accountsByEmail.get(email) ?? []
        const account = matches.length === 1 ? matches[0] : null
        const state: ContactRequestSenderState = {
          senderBlocked: blockedEmails.has(email),
          ambiguousAccount: matches.length > 1,
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
        }
        return [email, state]
      })
    )
  }
}
