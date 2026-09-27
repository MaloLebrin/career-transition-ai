import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Security from '../../../inertia/pages/Security'

vi.mock('@inertiajs/react', () => ({
  Head: ({ children }: { title?: string; children?: React.ReactNode }) => <>{children}</>,
  Link: ({
    href,
    className,
    children,
    ...rest
  }: {
    href: string
    className?: string
    children: React.ReactNode
  }) => (
    <a href={href} className={className} data-inertia-link="true" {...rest}>
      {children}
    </a>
  ),
  router: { visit: vi.fn() },
}))

describe('Security page', () => {
  test('renders security page title and sections', () => {
    render(<Security />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Sécurité & confidentialité/i })
    ).toBeInTheDocument()
    expect(screen.getAllByText(/Contrôle d’accès/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Gestion des incidents/i)).toBeInTheDocument()
  })

  test('décrit l’hébergement UE et le traitement pseudonymisé par l’IA', () => {
    render(<Security />)

    expect(screen.getByRole('heading', { name: /Intelligence artificielle/i })).toBeInTheDocument()
    expect(screen.getByText(/Mistral AI/)).toBeInTheDocument()
    expect(screen.getByText(/nom et l.e-mail du candidat sont retirés/i)).toBeInTheDocument()
    expect(screen.getByText(/hébergées dans l.Union européenne/i)).toBeInTheDocument()
  })
})
