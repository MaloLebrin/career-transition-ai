import type { NotificationStatus, NotificationType } from '#shared/constants/notifications'

export interface NotificationItem {
  id: number
  type: NotificationType
  status: NotificationStatus
  title: string
  body: string | null
  meta: Record<string, unknown> | null
  readAt: string | null
  createdAt: string
}
