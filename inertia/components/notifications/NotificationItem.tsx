import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { formatRelativeTime } from '#shared/helpers/date'
import type { NotificationItem as NotificationItemType } from '../../types/Notification'

interface Props {
  notification: NotificationItemType
  onMarkAsRead: (id: number) => void
}

function TypeIcon({ type }: { type: NotificationItemType['type'] }) {
  if (type === NOTIFICATION_TYPES.PDF_EXPORT_COMPLETED) {
    return (
      <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  }
  if (type === NOTIFICATION_TYPES.EXERCISE_COMPLETED) {
    return (
      <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4 text-violet-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.059l.216.097M14.25 3.104c.251.023.501.05.75.082M19.5 14.25v.75m-7.5-7.5h.008v.008H12V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}

export function NotificationItem({ notification, onMarkAsRead }: Props) {
  const isUnread = notification.status === 'unread'

  return (
    <div className={`flex gap-3 px-4 py-3 hover:bg-brand-navy/5 transition-colors ${isUnread ? 'bg-indigo-50/50' : ''}`}>
      <div className="mt-0.5">
        <TypeIcon type={notification.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${isUnread ? 'font-medium text-brand-navy' : 'text-brand-navy/70'}`}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-brand-navy/50 mt-0.5 line-clamp-2">{notification.body}</p>
        )}
        <p className="text-xs text-brand-navy/40 mt-1">{formatRelativeTime(notification.createdAt)}</p>
      </div>
      {isUnread && (
        <button
          type="button"
          onClick={() => onMarkAsRead(notification.id)}
          title="Marquer comme lu"
          className="mt-1 w-2 h-2 rounded-full bg-indigo-400 shrink-0 hover:bg-indigo-600 transition-colors"
        />
      )}
    </div>
  )
}
