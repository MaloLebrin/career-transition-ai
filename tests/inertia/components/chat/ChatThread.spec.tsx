import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { ChatThread } from '../../../../inertia/components/chat/ChatThread'
import { makeChatMessage } from '../../support/factories'

describe('ChatThread', () => {
  test('affiche les messages, les siens marqués comme tels', () => {
    render(
      <ChatThread
        viewerRole="candidate"
        hasMore={false}
        loadingMore={false}
        onLoadMore={vi.fn()}
        messages={[
          makeChatMessage({ id: 1, body: 'Salut', authorRole: 'candidate' }),
          makeChatMessage({ id: 2, body: 'Bonjour !', authorRole: 'expert' }),
        ]}
      />
    )
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveAttribute('data-mine', 'true')
    expect(items[1]).toHaveAttribute('data-mine', 'false')
    expect(screen.getByText('Bonjour !')).toBeInTheDocument()
  })

  test('état vide', () => {
    render(
      <ChatThread
        viewerRole="candidate"
        hasMore={false}
        loadingMore={false}
        onLoadMore={vi.fn()}
        messages={[]}
      />
    )
    expect(screen.getByText(/Aucun message/)).toBeInTheDocument()
  })

  test('« charger plus » n’apparaît que s’il reste des messages et déclenche le callback', async () => {
    const onLoadMore = vi.fn()
    const props = {
      viewerRole: 'expert' as const,
      loadingMore: false,
      onLoadMore,
      messages: [makeChatMessage()],
    }
    const { rerender } = render(<ChatThread {...props} hasMore={false} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    rerender(<ChatThread {...props} hasMore />)
    await userEvent.click(screen.getByRole('button', { name: /précédents/ }))
    expect(onLoadMore).toHaveBeenCalledOnce()
  })
})
