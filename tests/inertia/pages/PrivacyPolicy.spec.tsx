import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PrivacyPolicy from '../../../inertia/pages/PrivacyPolicy'

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

describe('PrivacyPolicy page', () => {
  test('renders privacy policy title and key blocks', () => {
    render(<PrivacyPolicy />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Politique de confidentialité/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/Responsable de traitement/i)).toBeInTheDocument()
    expect(screen.getByText(/Données collectées/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Vos droits/i).length).toBeGreaterThan(0)
  })
})

