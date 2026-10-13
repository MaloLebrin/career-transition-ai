export const CONTACT_REQUEST_TYPES = {
  CONTACT: 'contact',
  DEMO: 'demo',
} as const
export type ContactRequestType = (typeof CONTACT_REQUEST_TYPES)[keyof typeof CONTACT_REQUEST_TYPES]

export const CONTACT_REQUEST_STATUSES = {
  PENDING: 'pending',
  TREATED: 'treated',
  ARCHIVED: 'archived',
} as const
export type ContactRequestStatus =
  (typeof CONTACT_REQUEST_STATUSES)[keyof typeof CONTACT_REQUEST_STATUSES]

export const CONTACT_REQUEST_STATUS_LABELS: Record<ContactRequestStatus, string> = {
  [CONTACT_REQUEST_STATUSES.PENDING]: 'À traiter',
  [CONTACT_REQUEST_STATUSES.TREATED]: 'Traitée',
  [CONTACT_REQUEST_STATUSES.ARCHIVED]: 'Archivée',
}

export const CONTACT_REQUEST_TYPE_LABELS: Record<ContactRequestType, string> = {
  [CONTACT_REQUEST_TYPES.CONTACT]: 'Contact',
  [CONTACT_REQUEST_TYPES.DEMO]: 'Démo',
}
