import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { ContactRequestItem } from '#shared/types/contact_request/admin'

import ContactRequestsAdmin from '../../../../../../inertia/pages/dashboard/admin/contact_requests/Index'
import { SEARCH_DEBOUNCE_MS } from '../../../../../../inertia/hooks/use_server_list'
import { resetInertiaMock, routerSpies } from '../../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const PENDING: ContactRequestItem = {
  id: 4,
  name: 'Marie Dupont',
  email: 'marie@cabinet.fr',
  phone: '0601020304',
  organization: 'Cabinet Test',
  message: 'Bonjour, je souhaite une démo.',
  type: 'demo',
  status: 'pending',
  createdAt: '2026-10-10T09:00:00.000Z',
}

const PAGINATION = { page: 1, pageSize: 25, total: 1, lastPage: 1 }
const FILTERS = { search: '', status: 'all' as const, type: 'all' as const }

function renderPage(
  requests: ContactRequestItem[] = [PENDING],
  filters = FILTERS,
  pagination = PAGINATION
) {
  return render(
    <ContactRequestsAdmin requests={requests} pagination={pagination} filters={filters} />
  )
}

describe('ContactRequestsAdmin page (#73)', () => {
  beforeEach(() => resetInertiaMock())
  afterEach(() => vi.useRealTimers())

  test('affiche la demande avec son type, son statut et ses coordonnées', () => {
    renderPage()
    const item = screen.getByRole('listitem')

    expect(within(item).getByText('Marie Dupont')).toBeInTheDocument()
    expect(within(item).getByRole('link', { name: 'marie@cabinet.fr' })).toHaveAttribute(
      'href',
      'mailto:marie@cabinet.fr'
    )
    expect(within(item).getByText('Démo')).toBeInTheDocument()
    expect(within(item).getByText('À traiter')).toBeInTheDocument()
    expect(within(item).getByText('Bonjour, je souhaite une démo.')).toBeInTheDocument()
  })

  test('marquer comme traitée, archiver et remettre à traiter postent le statut', async () => {
    const user = userEvent.setup()
    renderPage([PENDING, { ...PENDING, id: 5, status: 'treated' }])
    const [first, second] = screen.getAllByRole('listitem')

    await user.click(within(first).getByRole('button', { name: 'Marquer comme traitée' }))
    expect(routerSpies.post).toHaveBeenLastCalledWith(
      '/dashboard/super-admin/contact-requests/4/status',
      { status: 'treated' },
      expect.objectContaining({ preserveScroll: true })
    )

    await user.click(within(first).getByRole('button', { name: 'Archiver' }))
    expect(routerSpies.post).toHaveBeenLastCalledWith(
      '/dashboard/super-admin/contact-requests/4/status',
      { status: 'archived' },
      expect.anything()
    )

    expect(
      within(second).queryByRole('button', { name: 'Marquer comme traitée' })
    ).not.toBeInTheDocument()
    await user.click(within(second).getByRole('button', { name: 'Remettre à traiter' }))
    expect(routerSpies.post).toHaveBeenLastCalledWith(
      '/dashboard/super-admin/contact-requests/5/status',
      { status: 'pending' },
      expect.anything()
    )
  })

  test('la recherche part au serveur après le délai ; le statut tout de suite', () => {
    vi.useFakeTimers()
    renderPage()

    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher une demande' }), {
      target: { value: 'marie' },
    })
    expect(routerSpies.get).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
    })
    expect(routerSpies.get).toHaveBeenLastCalledWith(
      '/dashboard/super-admin/contact-requests',
      { search: 'marie' },
      expect.objectContaining({ only: expect.arrayContaining(['requests']) })
    )

    fireEvent.change(screen.getByDisplayValue('Tous les statuts'), { target: { value: 'treated' } })
    expect(routerSpies.get).toHaveBeenLastCalledWith(
      '/dashboard/super-admin/contact-requests',
      { search: 'marie', status: 'treated' },
      expect.anything()
    )
  })

  test('états vides distincts selon qu’un filtre est actif ou non', () => {
    const { unmount } = renderPage([])
    expect(screen.getByText('Aucune demande de contact pour le moment.')).toBeInTheDocument()
    unmount()

    renderPage([], { ...FILTERS, search: 'zzz' })
    expect(screen.getByText('Aucune demande ne correspond à ces critères.')).toBeInTheDocument()
  })

  test('change de page en gardant les filtres', async () => {
    renderPage([PENDING], { ...FILTERS, status: 'pending' }, { ...PAGINATION, lastPage: 3 })

    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }))

    expect(routerSpies.get).toHaveBeenLastCalledWith(
      '/dashboard/super-admin/contact-requests',
      { status: 'pending', page: '2' },
      expect.anything()
    )
  })
})
