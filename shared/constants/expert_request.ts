/**
 * Demande d'accompagnement par un expert interne (épic B2C #90, #103) : un
 * particulier dont le forfait est réglé demande à être suivi ; les super
 * admins assignent un expert (#105). Les valeurs alimentent la contrainte
 * CHECK de `expert_requests.status`.
 */
export const EXPERT_REQUEST_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  CLOSED: 'closed',
} as const

export type ExpertRequestStatus =
  (typeof EXPERT_REQUEST_STATUSES)[keyof typeof EXPERT_REQUEST_STATUSES]

export const expertRequestStatusValues = Object.values(EXPERT_REQUEST_STATUSES)

export const EXPERT_REQUEST_STATUS_LABELS: Record<ExpertRequestStatus, string> = {
  [EXPERT_REQUEST_STATUSES.PENDING]: 'En attente',
  [EXPERT_REQUEST_STATUSES.ACCEPTED]: 'Acceptée',
  [EXPERT_REQUEST_STATUSES.DECLINED]: 'Refusée',
  [EXPERT_REQUEST_STATUSES.CLOSED]: 'Clôturée',
}

/** Longueur maximale du message libre du candidat (validator et champ). */
export const EXPERT_REQUEST_MESSAGE_MAX = 2000
/** Longueur maximale des disponibilités (texte libre). */
export const EXPERT_REQUEST_AVAILABILITY_MAX = 500

/** Pourquoi la demande n'est pas ouverte au candidat connecté. */
export const EXPERT_SUPPORT_LOCK_REASONS = {
  /** Candidat d'un cabinet : son conseiller l'accompagne déjà. */
  B2B: 'b2b',
  /** Particulier dont le forfait n'est pas réglé. */
  PAYMENT: 'payment',
} as const

export type ExpertSupportLockReason =
  (typeof EXPERT_SUPPORT_LOCK_REASONS)[keyof typeof EXPERT_SUPPORT_LOCK_REASONS]

/** Routes du parcours (#103) ; la page super admin arrive avec #105. */
export const EXPERT_REQUEST_PATHS = {
  page: '/dashboard/candidat/accompagnement',
  create: '/dashboard/candidat/expert-requests',
  admin: '/dashboard/super-admin/expert-requests',
} as const
