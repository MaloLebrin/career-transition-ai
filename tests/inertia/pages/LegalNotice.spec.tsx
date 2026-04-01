import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LegalNotice from '../../../inertia/pages/LegalNotice'

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

describe('LegalNotice page', () => {
  test('renders legal notice title and main blocks', () => {
    render(<LegalNotice />)

    expect(screen.getByRole('heading', { level: 1, name: /Mentions légales/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Éditeur du site/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Hébergement/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Propriété intellectuelle/i).length).toBeGreaterThan(0)
  })
})

