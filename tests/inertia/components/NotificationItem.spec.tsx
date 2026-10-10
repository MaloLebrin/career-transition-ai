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

  test("n'affiche pas le point non-lu pour une notification lue", () => {
    const readNotif: NotificationItemType = {
      ...baseNotification,
      status: 'read',
      readAt: new Date().toISOString(),
    }
    render(<NotificationItem notification={readNotif} onMarkAsRead={vi.fn()} />)
    expect(screen.queryByTitle('Marquer comme lu')).not.toBeInTheDocument()
  })

  test("appelle onMarkAsRead avec l'id quand le point est cliqué", () => {
    const onMarkAsRead = vi.fn()
    render(<NotificationItem notification={baseNotification} onMarkAsRead={onMarkAsRead} />)
    fireEvent.click(screen.getByTitle('Marquer comme lu'))
    expect(onMarkAsRead).toHaveBeenCalledWith(1)
  })

  test("n'affiche pas le body quand absent", () => {
    const noBody: NotificationItemType = { ...baseNotification, body: null }
    render(<NotificationItem notification={noBody} onMarkAsRead={vi.fn()} />)
    expect(screen.queryByText(/L'exercice motivation/)).not.toBeInTheDocument()
  })

  test('titre cliquable quand la notification pointe vers une page (#70)', () => {
    const onOpen = vi.fn()
    const linked: NotificationItemType = {
      ...baseNotification,
      type: 'step_unlocked',
      title: 'Nouvelle étape disponible',
      meta: { href: '/dashboard/candidat/steps/4' },
    }
    render(<NotificationItem notification={linked} onMarkAsRead={vi.fn()} onOpen={onOpen} />)

    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle étape disponible' }))
    expect(onOpen).toHaveBeenCalledWith(linked)
  })

  test('titre en texte simple sans lien interne valide', () => {
    const external: NotificationItemType = {
      ...baseNotification,
      meta: { href: 'https://evil.example/' },
    }
    render(<NotificationItem notification={external} onMarkAsRead={vi.fn()} onOpen={vi.fn()} />)

    expect(
      screen.queryByRole('button', { name: 'Exercice terminé par Jean Dupont' })
    ).not.toBeInTheDocument()
    expect(screen.getByText('Exercice terminé par Jean Dupont')).toBeInTheDocument()
  })

  test('rend la notification « analyse IA prête » du particulier (#100) avec son icône', () => {
    const { container } = render(
      <NotificationItem
        notification={{
          ...baseNotification,
          type: 'ai_analysis_ready_candidate',
          title: 'Votre analyse IA est disponible',
        }}
        onMarkAsRead={vi.fn()}
      />
    )
    expect(screen.getByText('Votre analyse IA est disponible')).toBeInTheDocument()
    expect(container.querySelector('svg.text-accent')).toBeInTheDocument()
  })

  test('rend la notification « demande d’accompagnement » des super admins (#103)', () => {
    const { container } = render(
      <NotificationItem
        notification={{
          ...baseNotification,
          type: 'expert_request_created',
          title: 'Demande d’accompagnement — candidat #12',
        }}
        onMarkAsRead={vi.fn()}
      />
    )
    expect(screen.getByText('Demande d’accompagnement — candidat #12')).toBeInTheDocument()
    expect(container.querySelector('svg.text-accent')).toBeInTheDocument()
  })

  test('rend les notifications d’assignation d’un expert (#105)', () => {
    for (const [type, title] of [
      ['expert_assigned', 'Votre expert : Nadia Experte'],
      ['candidate_assigned', 'Nouveau candidat à accompagner'],
      ['expert_request_declined', 'Votre demande d’accompagnement n’a pas pu aboutir'],
    ] as const) {
      const { container, unmount } = render(
        <NotificationItem
          notification={{ ...baseNotification, type, title }}
          onMarkAsRead={vi.fn()}
        />
      )
      expect(screen.getByText(title)).toBeInTheDocument()
      expect(container.querySelector('svg.text-accent')).toBeInTheDocument()
      unmount()
    }
  })

  test('rend les notifications de forfait débloqué et d’accès retiré (#104)', () => {
    const unlocked = render(
      <NotificationItem
        notification={{
          ...baseNotification,
          type: 'results_unlocked',
          title: 'Vos résultats sont débloqués',
        }}
        onMarkAsRead={vi.fn()}
      />
    )
    expect(screen.getByText('Vos résultats sont débloqués')).toBeInTheDocument()
    expect(unlocked.container.querySelector('svg.text-accent')).toBeInTheDocument()
    unlocked.unmount()

    const revoked = render(
      <NotificationItem
        notification={{
          ...baseNotification,
          type: 'results_access_revoked',
          title: 'Votre accès aux résultats a été retiré',
        }}
        onMarkAsRead={vi.fn()}
      />
    )
    expect(screen.getByText('Votre accès aux résultats a été retiré')).toBeInTheDocument()
    expect(revoked.container.querySelector('svg.text-muted')).toBeInTheDocument()
  })

  test('rend une notification de nouveau message du chat et l’ouvre', () => {
    const onOpen = vi.fn()
    const notification: NotificationItemType = {
      ...baseNotification,
      type: 'chat_message_received',
      title: 'Nouveau message de votre expert',
      meta: { href: '/dashboard/candidat/chat' },
    }
    render(<NotificationItem notification={notification} onMarkAsRead={vi.fn()} onOpen={onOpen} />)
    fireEvent.click(screen.getByText('Nouveau message de votre expert'))
    expect(onOpen).toHaveBeenCalledWith(notification)
  })
})
