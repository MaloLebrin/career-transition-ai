import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Offer from '../../../inertia/pages/Offer'

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

describe('Offer page', () => {
  test('renders core conversion elements and CTAs', () => {
    render(<Offer />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Un portail expert/i })
    ).toBeInTheDocument()
    expect(screen.getAllByText(/Demander une démo/i).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /Accès Expert/i }).length).toBeGreaterThan(0)
  })
})

