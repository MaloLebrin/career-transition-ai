import { isAdvisorOrAdmin } from '#shared/helpers/roles'
import { useRef, useState } from 'react'
import { useAuth } from '../../hooks/use_auth'
import { useNotifications } from '../../hooks/use_notifications'
import { NotificationItem } from './NotificationItem'

export function NotificationBell() {
  const { user } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  if (!user || !isAdvisorOrAdmin(user.role)) return null

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-brand-navy/60 hover:text-brand-navy hover:bg-brand-navy/5 transition-colors"
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-80 z-50 rounded-xl bg-white shadow-lg border border-brand-navy/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-navy/5">
              <span className="text-sm font-semibold text-brand-navy">Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-brand-navy/5">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-brand-navy/40">
                  Aucune notification
                </p>
              ) : (
                notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onMarkAsRead={(id) => {
                      markAsRead(id)
                      setOpen(false)
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
