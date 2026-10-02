export const NOTIFICATION_TYPES = {
  PDF_EXPORT_COMPLETED: 'pdf_export_completed',
  EXERCISE_COMPLETED: 'exercise_completed',
  AI_SYNTHESIS_READY: 'ai_synthesis_ready',
  // Candidat (#70)
  STEP_UNLOCKED: 'step_unlocked',
  APPOINTMENT_SCHEDULED: 'appointment_scheduled',
  SYNTHESIS_SHARED: 'synthesis_shared',
  // Équipe (super admin, conseiller) : demande d'effacement RGPD d'un candidat (#70)
  DATA_ERASURE_REQUESTED: 'data_erasure_requested',
  // Particulier B2C sans conseiller : son analyse IA est prête (#100)
  AI_ANALYSIS_READY_CANDIDATE: 'ai_analysis_ready_candidate',
  // Super admins : un particulier demande un accompagnement par un expert (#103)
  EXPERT_REQUEST_CREATED: 'expert_request_created',
  // Assignation d'un expert (#105) : candidat prévenu, expert prévenu, ou demande refusée
  EXPERT_ASSIGNED: 'expert_assigned',
  CANDIDATE_ASSIGNED: 'candidate_assigned',
  EXPERT_REQUEST_DECLINED: 'expert_request_declined',
} as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES]
export const notificationTypeValues = Object.values(NOTIFICATION_TYPES)

export const NOTIFICATION_STATUSES = {
  UNREAD: 'unread',
  READ: 'read',
} as const

export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[keyof typeof NOTIFICATION_STATUSES]
export const notificationStatusValues = Object.values(NOTIFICATION_STATUSES)
