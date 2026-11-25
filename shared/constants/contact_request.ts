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

/**
 * Durée de conservation d'une adresse bloquée pour le formulaire de contact, en années : au-delà,
 * le blocage est levé par la purge nocturne (`PurgeExpiredContactBlocksJob`).
 */
export const CONTACT_BLOCK_RETENTION_YEARS = 3

/**
 * Attente (ms, tirée au hasard dans l'intervalle) avant de répondre à une adresse bloquée : un
 * envoi normal attend ses deux e-mails, une réponse immédiate trahirait le blocage.
 */
export const BLOCKED_CONTACT_RESPONSE_DELAY_MS = { MIN: 300, MAX: 900 } as const
