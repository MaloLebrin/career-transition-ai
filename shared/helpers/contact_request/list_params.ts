import {
  CONTACT_REQUEST_STATUSES,
  CONTACT_REQUEST_TYPES,
  type ContactRequestStatus,
  type ContactRequestType,
} from '#shared/constants/contact_request'
import { parseListParams } from '#shared/helpers/pagination'
import type { ContactRequestListParams } from '#shared/types/contact_request/admin'

/** `?page=&search=&status=&type=` de la boîte des demandes ; valeur inconnue ignorée. */
export function parseContactRequestListParams(
  qs: Record<string, unknown>
): ContactRequestListParams {
  const status = Object.values(CONTACT_REQUEST_STATUSES).includes(qs.status as ContactRequestStatus)
    ? (qs.status as ContactRequestStatus)
    : null
  const type = Object.values(CONTACT_REQUEST_TYPES).includes(qs.type as ContactRequestType)
    ? (qs.type as ContactRequestType)
    : null
  return { ...parseListParams(qs), status, type }
}
