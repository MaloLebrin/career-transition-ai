import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Pricing from '../../../inertia/pages/Pricing'

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
  useForm: () => ({
    data: { name: '', email: '', phone: '', organization: '', message: '', type: 'demo' },
    setData: vi.fn(),
    post: vi.fn(),
    processing: false,
    errors: {},
    wasSuccessful: false,
    reset: vi.fn(),
  }),
}))

describe('Pricing page', () => {
  test('renders three pricing tiers, FAQ and devis CTA', () => {
    render(<Pricing />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Des offres claires/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Essentiel$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Professionnel$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Cabinet\+$/i })).toBeInTheDocument()
    expect(screen.getByText(/Questions fréquentes/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Demander un devis/i).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /Accès Expert/i }).length).toBeGreaterThan(0)
  })
})
