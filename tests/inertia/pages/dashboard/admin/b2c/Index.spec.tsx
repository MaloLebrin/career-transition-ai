import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderWithUser } from '../../../../support/render'

import B2cAdmin from '../../../../../../inertia/pages/dashboard/admin/b2c/Index'
import { resetInertiaMock, routerSpies } from '../../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}))

describe('B2cAdmin page (#107)', () => {
  beforeEach(() => resetInertiaMock())

  test('indicateurs et tableau des particuliers', () => {
    render(
      <B2cAdmin
        candidates={{
          page: 1,
          total: 1,
          lastPage: 1,
          items: [
            {
              id: 1,
              name: 'Camille Durand',
              email: 'camille@example.test',
              emailVerified: true,
              createdAt: '2026-10-02T10:00:00.000Z',
              hasPaidAccess: true,
              activePaymentId: 11,
              expert: null,
              pendingExpertRequest: false,
            },
          ],
        }}
        stats={{
          candidates: 12,
          paid: 4,
          monthRevenueCents: 19_600,
          currency: 'eur',
          pendingExpertRequests: 2,
        }}
      />
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Particuliers' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: '12 Inscrits' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: '4 Forfaits réglés' })).toBeInTheDocument()
    expect(
      screen.getByRole('article', { name: /196.*Chiffre d’affaires du mois/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('article', { name: '2 Demandes d’accompagnement en attente' })
    ).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Particuliers inscrits' })).toHaveTextContent(
      'Camille Durand'
    )
  })

  test('pagination des particuliers via router.get', async () => {
    const { user } = renderWithUser(
      <B2cAdmin
        candidates={{ items: [], page: 2, total: 120, lastPage: 3 }}
        stats={{
          candidates: 120,
          paid: 0,
          monthRevenueCents: 0,
          currency: 'eur',
          pendingExpertRequests: 0,
        }}
      />
    )

    expect(screen.getByText('Page 2 / 3')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Suivant' }))
    expect(routerSpies.get).toHaveBeenLastCalledWith(
      '/dashboard/super-admin/b2c',
      { page: '3' },
      expect.objectContaining({ preserveScroll: true, only: ['candidates'] })
    )
    await user.click(screen.getByRole('button', { name: 'Précédent' }))
    expect(routerSpies.get).toHaveBeenLastCalledWith(
      '/dashboard/super-admin/b2c',
      {},
      expect.anything()
    )
  })
})
