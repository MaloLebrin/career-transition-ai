import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import OrganizationsAdmin from '../../../../../../inertia/pages/dashboard/admin/organizations/Index'
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

const ORGANIZATION = {
  id: 7,
  name: 'Cabinet Horizon',
  slug: 'horizon',
  ownerId: 11,
  usersCount: 3,
  employeesCount: 12,
  createdAt: '2026-09-01T10:00:00.000Z',
}

function renderPage(pagination = { page: 1, pageSize: 25, total: 1, lastPage: 1 }, filters = {}) {
  return render(
    <OrganizationsAdmin
      organizations={[ORGANIZATION]}
      pagination={pagination}
      filters={{ search: '', minEmployees: '', ...filters }}
    />
  )
}

describe('OrganizationsAdmin page (#75)', () => {
  beforeEach(() => {
    resetInertiaMock()
    setPageProps({ user: { id: 1, role: 'super_admin' } })
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  test('affiche les organisations de la page', () => {
    renderPage()
    expect(screen.getByText('Cabinet Horizon')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  test('la recherche et le seuil partent au serveur après le délai', () => {
    renderPage()
    fireEvent.change(screen.getByPlaceholderText('Rechercher par nom, slug ou ID…'), {
      target: { value: 'hor' },
    })
    fireEvent.change(screen.getByPlaceholderText('Min talents'), { target: { value: '5' } })
    expect(routerSpies.get).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
    })
    expect(routerSpies.get).toHaveBeenCalledTimes(1)
    expect(routerSpies.get).toHaveBeenCalledWith(
      '/dashboard/super-admin/organizations',
      { search: 'hor', minEmployees: '5' },
      expect.objectContaining({ only: expect.arrayContaining(['organizations']) })
    )
  })

  test('initialise les champs depuis les filtres et change de page en les gardant', () => {
    renderPage(
      { page: 1, pageSize: 25, total: 80, lastPage: 4 },
      { search: 'hor', minEmployees: 2 }
    )
    expect(screen.getByPlaceholderText('Rechercher par nom, slug ou ID…')).toHaveValue('hor')

    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }))
    expect(routerSpies.get).toHaveBeenCalledWith(
      '/dashboard/super-admin/organizations',
      { search: 'hor', minEmployees: '2', page: '2' },
      expect.anything()
    )
  })
})
