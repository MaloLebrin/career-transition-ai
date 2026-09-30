import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { formatRelativeTime } from '#shared/helpers/date'
import { notificationHref } from '#shared/helpers/notification_links'
import type { NotificationItem as NotificationItemType } from '../../types/notification'

interface Props {
  notification: NotificationItemType
  onMarkAsRead: (id: number) => void
  /** Ouvre la page liée à la notification (`meta.href`). */
  onOpen?: (notification: NotificationItemType) => void
}

function TypeIcon({ type }: { type: NotificationItemType['type'] }) {
  switch (type) {
    case NOTIFICATION_TYPES.PDF_EXPORT_COMPLETED:
      return (
        <svg
          className="w-4 h-4 text-indigo-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      )
    case NOTIFICATION_TYPES.EXERCISE_COMPLETED:
      return (
        <svg
          className="w-4 h-4 text-emerald-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )
    case NOTIFICATION_TYPES.AI_SYNTHESIS_READY:
      return (
        <svg
          className="w-4 h-4 text-violet-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.059l.216.097M14.25 3.104c.251.023.501.05.75.082M19.5 14.25v.75m-7.5-7.5h.008v.008H12V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
      )
    case NOTIFICATION_TYPES.STEP_UNLOCKED:
      return (
        <svg
          className="w-4 h-4 text-emerald-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      )
    case NOTIFICATION_TYPES.APPOINTMENT_SCHEDULED:
      return (
        <svg
          className="w-4 h-4 text-sky-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
        </svg>
      )
    case NOTIFICATION_TYPES.SYNTHESIS_SHARED:
      return (
        <svg
          className="w-4 h-4 text-indigo-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      )
    case NOTIFICATION_TYPES.DATA_ERASURE_REQUESTED:
      return (
        <svg
          className="w-4 h-4 text-rose-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
      )
    default:
      return (
        <svg
          className="w-4 h-4 text-violet-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.059l.216.097M14.25 3.104c.251.023.501.05.75.082M19.5 14.25v.75m-7.5-7.5h.008v.008H12V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
      )
  }
}

export function NotificationItem({ notification, onMarkAsRead, onOpen }: Props) {
  const isUnread = notification.status === 'unread'
  const href = notificationHref(notification.meta)
  const titleClassName = `text-sm leading-snug ${isUnread ? 'font-medium text-brand-navy' : 'text-brand-navy/70'}`

  return (
    <div
      className={`flex gap-3 px-4 py-3 hover:bg-brand-navy/5 transition-colors ${isUnread ? 'bg-indigo-50/50' : ''}`}
    >
      <div className="mt-0.5">
        <TypeIcon type={notification.type} />
      </div>
      <div className="flex-1 min-w-0">
        {href && onOpen ? (
          <button
            type="button"
            onClick={() => onOpen(notification)}
            className={`${titleClassName} text-left hover:underline`}
          >
            {notification.title}
          </button>
        ) : (
          <p className={titleClassName}>{notification.title}</p>
        )}
        {notification.body && (
          <p className="text-xs text-brand-navy/50 mt-0.5 line-clamp-2">{notification.body}</p>
        )}
        <p className="text-xs text-brand-navy/40 mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
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
