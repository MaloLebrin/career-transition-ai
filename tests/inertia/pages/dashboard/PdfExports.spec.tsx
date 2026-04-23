import { describe, test, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import PdfExportsList from '../../../../inertia/pages/dashboard/admin/jobs/Index'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'

vi.mock('@inertiajs/react', () => ({
  Head: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  usePage: () => ({
    url: '/dashboard/conseiller/pdf-exports',
    props: {
      user: { id: 1, role: 'super_admin' as const, name: 'Super Admin' },
    },
  }),
}))

vi.mock('../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const subscriptionCreateMock = vi.fn().mockResolvedValue(undefined)
const subscriptionOnMessageMock = vi.fn().mockReturnValue(() => {})
const subscriptionDeleteMock = vi.fn().mockResolvedValue(undefined)

vi.mock('@adonisjs/transmit-client', () => {
  return {
    Transmit: vi.fn().mockImplementation(() => ({
      subscription: () => ({
        create: subscriptionCreateMock,
        onMessage: subscriptionOnMessageMock,
        delete: subscriptionDeleteMock,
      }),
    })),
  }
})

describe('Pdf exports list page', () => {
  test('renders table and empty state message', async () => {
    render(<PdfExportsList />)

    expect(screen.getByText(/Exports PDF/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/Aucun export PDF pour le moment/i)).toBeInTheDocument()
    })
  })

  test('renders download link when export completed with downloadUrl', () => {
    render(
      <PdfExportsList
        exports={[
          {
            id: 42,
            userId: 1,
            organizationId: 1,
            employeeId: 9,
            advisorUserId: 2,
            status: PDF_EXPORT_STATUSES.COMPLETED,
            errorMessage: null,
            createdAt: new Date().toISOString(),
            startedAt: null,
            finishedAt: null,
            downloadUrl: '/dashboard/pdf-exports/42/download',
            fileName: 'out.pdf',
          },
        ]}
      />
    )

    const link = screen.getByRole('link', { name: /Télécharger/i })
    expect(link).toHaveAttribute('href', '/dashboard/pdf-exports/42/download')
  })
})
