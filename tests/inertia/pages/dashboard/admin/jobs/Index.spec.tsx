import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import PdfExportsList from '../../../../../../inertia/pages/dashboard/admin/jobs/Index'
import { resetInertiaMock, routerSpies, setPageProps } from '../../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

vi.mock('@adonisjs/transmit-client', () => ({
  Transmit: class {
    subscription() {
      return {
        create: () => Promise.resolve(),
        onMessage: () => () => {},
        delete: () => Promise.resolve(),
      }
    }
  },
}))

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}))

describe('PdfExportsList page (#75)', () => {
  beforeEach(() => {
    resetInertiaMock()
    setPageProps({ user: { id: 1, role: 'admin' } })
  })

  test('affiche la pagination et conserve le filtre de statut en changeant de page', () => {
    window.history.pushState({}, '', '/dashboard/conseiller/pdf-exports?status=failed')
    render(
      <PdfExportsList
        exports={[]}
        pagination={{ page: 1, pageSize: 25, total: 60, lastPage: 3 }}
        filters={{ status: 'failed' }}
      />
    )

    expect(screen.getByText('Page 1 / 3')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }))
    expect(routerSpies.get).toHaveBeenCalledWith(
      '/dashboard/conseiller/pdf-exports',
      { status: 'failed', page: '2' },
      expect.objectContaining({ only: ['exports', 'pagination', 'filters'] })
    )
  })

  test('sans pagination fournie, aucune navigation n’est affichée', () => {
    render(<PdfExportsList exports={[]} />)
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument()
  })
})
