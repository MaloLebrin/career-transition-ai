import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { NotificationItem } from '../../../inertia/components/notifications/NotificationItem'
import type { NotificationItem as NotificationItemType } from '../../../inertia/types/notification'

const baseNotification: NotificationItemType = {
  id: 1,
  type: 'exercise_completed',
  status: 'unread',
  title: 'Exercice terminé par Jean Dupont',
  body: "L'exercice motivation vient d'être complété.",
  meta: null,
  readAt: null,
  createdAt: new Date().toISOString(),
}

describe('NotificationItem', () => {
  test('affiche le titre de la notification', () => {
    render(<NotificationItem notification={baseNotification} onMarkAsRead={vi.fn()} />)
    expect(screen.getByText('Exercice terminé par Jean Dupont')).toBeInTheDocument()
  })

  test('affiche le body quand présent', () => {
    render(<NotificationItem notification={baseNotification} onMarkAsRead={vi.fn()} />)
    expect(screen.getByText(/L'exercice motivation/)).toBeInTheDocument()
  })

  test('affiche le point non-lu pour une notification unread', () => {
    render(<NotificationItem notification={baseNotification} onMarkAsRead={vi.fn()} />)
    const dot = screen.getByTitle('Marquer comme lu')
    expect(dot).toBeInTheDocument()
  })

  test('n\'affiche pas le point non-lu pour une notification lue', () => {
    const readNotif: NotificationItemType = {
      ...baseNotification,
      status: 'read',
      readAt: new Date().toISOString(),
    }
    render(<NotificationItem notification={readNotif} onMarkAsRead={vi.fn()} />)
    expect(screen.queryByTitle('Marquer comme lu')).not.toBeInTheDocument()
  })

  test('appelle onMarkAsRead avec l\'id quand le point est cliqué', () => {
    const onMarkAsRead = vi.fn()
    render(<NotificationItem notification={baseNotification} onMarkAsRead={onMarkAsRead} />)
    fireEvent.click(screen.getByTitle('Marquer comme lu'))
    expect(onMarkAsRead).toHaveBeenCalledWith(1)
  })

  test('n\'affiche pas le body quand absent', () => {
    const noBody: NotificationItemType = { ...baseNotification, body: null }
    render(<NotificationItem notification={noBody} onMarkAsRead={vi.fn()} />)
    expect(screen.queryByText(/L'exercice motivation/)).not.toBeInTheDocument()
  })
})
