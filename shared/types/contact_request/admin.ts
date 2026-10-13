import type { ContactRequestStatus, ContactRequestType } from '#shared/constants/contact_request'
import type { ListParams } from '#shared/types/pagination'

/** Paramètres de la boîte des demandes de contact (`?page=&search=&status=&type=`). */
export interface ContactRequestListParams extends ListParams {
  /** Statut filtré ; `null` = tous. */
  status: ContactRequestStatus | null
  /** Type filtré ; `null` = tous. */
  type: ContactRequestType | null
}

/** Une demande de contact vue du back-office. */
export interface ContactRequestItem {
  id: number
  name: string
  email: string
  phone: string | null
  organization: string | null
  message: string
  type: ContactRequestType
  status: ContactRequestStatus
  createdAt: string
}
