import { Transmit } from '@adonisjs/transmit-client'
import { router, usePage } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import type { NotificationItem } from '../types/notification'
import { useAuth } from './use_auth'

export function useNotifications() {
  const { props } = usePage<{
    notifications?: NotificationItem[]
    unreadNotificationsCount?: number
  }>()
  const { user } = useAuth()

  const [notifications, setNotifications] = useState<NotificationItem[]>(props.notifications ?? [])
  const [unreadCount, setUnreadCount] = useState(props.unreadNotificationsCount ?? 0)

  useEffect(() => {
    setNotifications(props.notifications ?? [])
    setUnreadCount(props.unreadNotificationsCount ?? 0)
  }, [props.notifications, props.unreadNotificationsCount])

  useEffect(() => {
    if (!user) return

    const transmit = new Transmit({ baseUrl: window.location.origin })
    const subscription = transmit.subscription(`users/${user.id}/notifications`)
    let unsubscribe: (() => void) | null = null

    subscription
      .create()
      .then(() => {
        unsubscribe = subscription.onMessage((data: NotificationItem) => {
          setNotifications((prev) => [data, ...prev])
          setUnreadCount((c) => c + 1)
        })
      })
      .catch(() => {})

    return () => {
      if (unsubscribe) unsubscribe()
      subscription.delete().catch(() => {})
    }
  }, [user?.id])

  const markAsRead = (id: number) => {
    router.patch(
      `/dashboard/notifications/${id}/read`,
      {},
      { preserveState: true, preserveScroll: true }
    )
  }

  const markAllAsRead = () => {
    router.patch(
      '/dashboard/notifications/read-all',
      {},
      { preserveState: true, preserveScroll: true }
    )
  }

  return { notifications, unreadCount, markAsRead, markAllAsRead }
}
