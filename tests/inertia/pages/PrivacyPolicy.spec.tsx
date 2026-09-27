import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PrivacyPolicy from '../../../inertia/pages/PrivacyPolicy'
import {
  PRIVACY_CONTACT_EMAIL,
  RETENTION_PERIODS,
  SUBPROCESSORS,
} from '#shared/constants/legal'

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
    expect(screen.getByRole('heading', { name: /Responsable de traitement/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Données collectées/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Vos droits/i).length).toBeGreaterThan(0)
  })

  test('nomme chaque sous-traitant et sa localisation', () => {
    render(<PrivacyPolicy />)

    for (const subprocessor of SUBPROCESSORS) {
      expect(screen.getByText(subprocessor.name)).toBeInTheDocument()
      expect(screen.getByText(`(${subprocessor.location})`)).toBeInTheDocument()
    }
    expect(screen.getByText('Mistral AI')).toBeInTheDocument()
    expect(screen.getByText('Resend')).toBeInTheDocument()
  })

  test('affiche les durées de conservation', () => {
    render(<PrivacyPolicy />)

    for (const period of RETENTION_PERIODS) {
      expect(screen.getByText(period.duration)).toBeInTheDocument()
    }
  })

  test('donne un contact pour exercer ses droits, sans placeholder', () => {
    const { container } = render(<PrivacyPolicy />)

    const links = screen.getAllByRole('link', { name: PRIVACY_CONTACT_EMAIL })
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link).toHaveAttribute('href', `mailto:${PRIVACY_CONTACT_EMAIL}`)
    }
    expect(screen.getByText(/CNIL/)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/contact à compléter|coordonnées à compléter/)
  })
})
