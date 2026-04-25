import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Methodology from '../../../inertia/pages/Methodology'

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
    data: { name: '', email: '', phone: '', organization: '', message: '', type: 'contact' },
    setData: vi.fn(),
    post: vi.fn(),
    processing: false,
    errors: {},
    wasSuccessful: false,
    reset: vi.fn(),
  }),
}))

describe('Methodology page', () => {
  test('renders core marketing sections and CTA', () => {
    render(<Methodology />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Une méthode d'accompagnement/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/Cadre scientifique/i)).toBeInTheDocument()
    expect(screen.getByText(/Pour le conseiller/i)).toBeInTheDocument()
    expect(screen.getByText(/Éthique & limites/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Accès Expert/i }).length).toBeGreaterThan(0)
  })
})

