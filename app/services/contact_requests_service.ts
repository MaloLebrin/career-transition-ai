import { ContactRequestNotFoundError } from '#exceptions/contact_request_errors'
import ContactRequest from '#models/contact_request'
import {
  CONTACT_REQUEST_STATUSES,
  type ContactRequestStatus,
} from '#shared/constants/contact_request'
import { ContactRequestMailService } from '#services/mail/contact_request_mail_service'
import { LIST_PAGE_SIZE } from '#shared/constants/pagination'
import type {
  ContactRequestItem,
  ContactRequestListParams,
} from '#shared/types/contact_request/admin'
import type { CreateContactRequestInput } from '#shared/types/contact_request/inputs'
import type { Paginated } from '#shared/types/pagination'
import { paginationMeta, whereAnyColumnContains } from '#utils/pagination'
import { inject } from '@adonisjs/core'

/**
 * Demandes de contact / démo du formulaire public (`ContactDemoForm`).
 */
@inject()
export class ContactRequestsService {
  constructor(private mailService: ContactRequestMailService) {}

  /**
   * Enregistre la demande (statut `pending`) puis prévient l'équipe et le
   * demandeur. Un échec d'envoi n'annule pas la demande : elle reste en base.
   */
  public async create(input: CreateContactRequestInput): Promise<ContactRequest> {
    const contactRequest = await ContactRequest.create({
      ...input,
      status: CONTACT_REQUEST_STATUSES.PENDING,
    })

    await Promise.allSettled([
      this.mailService.sendAdminNotification(contactRequest),
      this.mailService.sendConfirmationToRequester(contactRequest),
    ])

    return contactRequest
  }

  /**
   * Une page de la boîte des demandes (back-office super admin) : les plus récentes d'abord,
   * recherche nom / e-mail / organisation, filtres de statut et de type.
   */
  public async list(params: ContactRequestListParams): Promise<Paginated<ContactRequestItem>> {
    const query = ContactRequest.query()
      .if(params.status !== null, (q) => q.where('status', params.status!))
      .if(params.type !== null, (q) => q.where('type', params.type!))
      .orderBy([
        { column: 'createdAt', order: 'desc' },
        { column: 'id', order: 'desc' },
      ])
    whereAnyColumnContains(query, ['name', 'email', 'organization'], params.search)

    const paginator = await query.paginate(params.page, LIST_PAGE_SIZE)
    return {
      items: paginator.all().map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        organization: row.organization,
        message: row.message,
        type: row.type,
        status: row.status,
        createdAt: row.createdAt.toISO()!,
      })),
      pagination: paginationMeta(paginator, LIST_PAGE_SIZE),
    }
  }

  /** Marque une demande comme traitée, archivée ou de nouveau en attente. */
  public async updateStatus(id: number, status: ContactRequestStatus): Promise<ContactRequest> {
    const contactRequest = await ContactRequest.find(id)
    if (!contactRequest) throw new ContactRequestNotFoundError()
    contactRequest.status = status
    await contactRequest.save()
    return contactRequest
  }
}
