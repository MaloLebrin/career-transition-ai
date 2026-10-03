import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import PaymentsAdmin from '../../../../../../inertia/pages/dashboard/admin/payments/Index'
import type { PaymentsListResult } from '#shared/types/billing/admin'
import { renderWithUser } from '../../../../support/render'
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

const result: PaymentsListResult = {
  items: [],
  filter: { status: null, page: 2 },
  total: 120,
  lastPage: 3,
}

describe('PaymentsAdmin page (#107)', () => {
  beforeEach(() => resetInertiaMock())

  test('filtre par statut et pagination via router.get', async () => {
    const { user } = renderWithUser(<PaymentsAdmin payments={result} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Paiements du forfait' })
    ).toBeInTheDocument()
    expect(screen.getByText(/120 paiement\(s\)/)).toBeInTheDocument()
    expect(screen.getByText('Page 2 / 3')).toBeInTheDocument()

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Filtrer par statut' }),
      'refunded'
    )
    expect(routerSpies.get).toHaveBeenNthCalledWith(
      1,
      '/dashboard/super-admin/payments',
      { status: 'refunded' },
      expect.objectContaining({ preserveScroll: true, preserveState: true })
    )

    await user.click(screen.getByRole('button', { name: 'Suivant' }))
    expect(routerSpies.get).toHaveBeenNthCalledWith(
      2,
      '/dashboard/super-admin/payments',
      { page: '3' },
      expect.anything()
    )
  })

  test('une seule page : pas de pagination, état vide du tableau', () => {
    renderWithUser(
      <PaymentsAdmin payments={{ ...result, filter: { status: null, page: 1 }, lastPage: 1 }} />
    )

    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Aucun paiement pour ce filtre.')
  })
})
