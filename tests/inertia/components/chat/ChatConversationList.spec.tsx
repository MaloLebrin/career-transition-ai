import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { ChatConversationList } from '../../../../inertia/components/chat/ChatConversationList'
import { makeChatSummary } from '../../support/factories'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

describe('ChatConversationList', () => {
  test('état vide', () => {
    render(<ChatConversationList conversations={[]} />)
    expect(screen.getByText('Aucune conversation pour le moment.')).toBeInTheDocument()
  })

  test('liste état, aperçu, lien et badge de non-lus', () => {
    render(
      <ChatConversationList
        conversations={[
          makeChatSummary({ id: 1, assignment: 'queue', unreadCount: 3 }),
          makeChatSummary({ id: 2, candidateLabel: 'Candidat #8', assignment: 'me' }),
          makeChatSummary({ id: 3, candidateLabel: 'Candidat #9', assignment: 'other' }),
        ]}
      />
    )
    expect(screen.getByText('File d’attente')).toBeInTheDocument()
    expect(screen.getByText('Mes conversations')).toBeInTheDocument()
    expect(screen.getByText('Autre expert')).toBeInTheDocument()
    expect(screen.getByLabelText('3 non lus')).toBeInTheDocument()
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', '/dashboard/conseiller/chat/1')
    expect(screen.queryByLabelText('0 non lus')).not.toBeInTheDocument()
  })
})
