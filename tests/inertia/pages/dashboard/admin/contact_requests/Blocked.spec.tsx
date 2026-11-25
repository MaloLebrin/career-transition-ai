import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { BlockedContactEmailItem } from '#shared/types/contact_request/admin'

import BlockedContactEmails from '../../../../../../inertia/pages/dashboard/admin/contact_requests/Blocked'
import { SEARCH_DEBOUNCE_MS } from '../../../../../../inertia/hooks/use_server_list'
import { resetInertiaMock, routerSpies } from '../../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const BLOCKED: BlockedContactEmailItem = {
  id: 7,
  email: 'spam@exemple.test',
  blockedAt: '2026-11-20T09:00:00.000Z',
}
const PAGINATION = { page: 1, pageSize: 25, total: 1, lastPage: 1 }

function renderPage(blockedEmails: BlockedContactEmailItem[] = [BLOCKED], search = '') {
  return render(
    <BlockedContactEmails
      blockedEmails={blockedEmails}
      pagination={PAGINATION}
      filters={{ search }}
    />
  )
}

describe('BlockedContactEmails page', () => {
  beforeEach(() => resetInertiaMock())
  afterEach(() => vi.useRealTimers())

  test('liste les adresses bloquées et rappelle la durée du blocage', () => {
    renderPage()
    const item = screen.getByRole('listitem')

    expect(within(item).getByText('spam@exemple.test')).toBeInTheDocument()
    expect(within(item).getByText(/Bloquée le/)).toBeInTheDocument()
    expect(screen.getByText(/levé automatiquement au bout de 3 ans/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour aux demandes de contact' })).toHaveAttribute(
      'href',
      '/dashboard/super-admin/contact-requests'
    )
  })

  test('débloquer poste sur la route de l’adresse, sans passer par une demande', async () => {
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Débloquer spam@exemple.test' }))

    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/super-admin/contact-requests/blocked/7/unblock',
      {},
      expect.objectContaining({ preserveScroll: true })
    )
  })

  test('la recherche part au serveur après le délai', () => {
    vi.useFakeTimers()
    renderPage()

    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher une adresse bloquée' }), {
      target: { value: 'spam' },
    })
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
    })

    expect(routerSpies.get).toHaveBeenCalledWith(
      '/dashboard/super-admin/contact-requests/blocked',
      { search: 'spam' },
      expect.anything()
    )
  })

  test('états vides distincts selon qu’une recherche est active ou non', () => {
    const { unmount } = renderPage([])
    expect(screen.getByRole('status')).toHaveTextContent('Aucune adresse bloquée pour le moment.')
    unmount()

    renderPage([], 'zzz')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Aucune adresse bloquée ne correspond à cette recherche.'
    )
  })
})
