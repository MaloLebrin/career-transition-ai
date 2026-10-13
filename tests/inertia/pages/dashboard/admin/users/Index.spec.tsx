import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import UsersAdmin from '../../../../../../inertia/pages/dashboard/admin/users/Index'
import { SEARCH_DEBOUNCE_MS } from '../../../../../../inertia/hooks/use_server_list'
import { resetInertiaMock, routerSpies, setPageProps } from '../../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}))

const USER = {
  id: 5,
  name: 'Alice Martin',
  email: 'alice@horizon.test',
  role: 'advisor' as const,
  organization: { id: 7, name: 'Cabinet Horizon' },
  createdAt: '2026-09-01T10:00:00.000Z',
  onboardingCompleted: true,
}

function renderPage(pagination = { page: 1, pageSize: 25, total: 1, lastPage: 1 }, filters = {}) {
  return render(
    <UsersAdmin
      users={[USER]}
      organizations={[{ id: 7, name: 'Cabinet Horizon', slug: 'horizon' }]}
      pagination={pagination}
      filters={{ search: '', role: 'all', ...filters } as never}
    />
  )
}

describe('UsersAdmin page (#75)', () => {
  beforeEach(() => {
    resetInertiaMock()
    setPageProps({ user: { id: 1, role: 'super_admin' } })
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  test('affiche les utilisateurs de la page', () => {
    renderPage()
    expect(screen.getByText('Alice Martin')).toBeInTheDocument()
    expect(screen.getByText('alice@horizon.test')).toBeInTheDocument()
  })

  test('la recherche part au serveur après le délai', () => {
    renderPage()
    fireEvent.change(screen.getByPlaceholderText('Rechercher par nom, email, cabinet…'), {
      target: { value: 'ali' },
    })
    expect(routerSpies.get).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
    })
    expect(routerSpies.get).toHaveBeenCalledWith(
      '/dashboard/super-admin/users',
      { search: 'ali' },
      expect.objectContaining({ only: expect.arrayContaining(['users']) })
    )
  })

  test('le filtre de rôle part immédiatement au serveur', () => {
    renderPage()
    fireEvent.change(screen.getByDisplayValue('Tous les rôles'), { target: { value: 'admin' } })

    expect(routerSpies.get).toHaveBeenCalledWith(
      '/dashboard/super-admin/users',
      { role: 'admin' },
      expect.anything()
    )
  })

  test('change de page en gardant la recherche', () => {
    renderPage({ page: 2, pageSize: 25, total: 80, lastPage: 4 }, { search: 'ali' })

    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }))
    expect(routerSpies.get).toHaveBeenCalledWith(
      '/dashboard/super-admin/users',
      { search: 'ali', page: '3' },
      expect.anything()
    )
  })
})
