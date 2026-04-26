export const NOTIFICATION_TYPES = {
  PDF_EXPORT_COMPLETED: 'pdf_export_completed',
  EXERCISE_COMPLETED: 'exercise_completed',
  AI_SYNTHESIS_READY: 'ai_synthesis_ready',
} as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES]
export const notificationTypeValues = Object.values(NOTIFICATION_TYPES)

export const NOTIFICATION_STATUSES = {
  UNREAD: 'unread',
  READ: 'read',
} as const

export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[keyof typeof NOTIFICATION_STATUSES]
export const notificationStatusValues = Object.values(NOTIFICATION_STATUSES)
