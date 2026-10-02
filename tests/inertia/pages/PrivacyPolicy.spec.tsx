import { describe, test, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import PrivacyPolicy from '../../../inertia/pages/PrivacyPolicy'
import {
  PRIVACY_CONTACT_EMAIL,
  RETENTION_NOTICE,
  RETENTION_PERIODS,
  SUBPROCESSORS,
} from '#shared/constants/legal'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

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
    // Stockage des exports PDF (issue #49).
    expect(screen.getByText('Cloudinary')).toBeInTheDocument()
  })

  test('section Particuliers : responsable de traitement, Stripe, liens CGU / CGV (#95)', () => {
    render(<PrivacyPolicy />)

    expect(
      screen.getByRole('heading', { name: /Particuliers inscrits en libre-service/i })
    ).toBeInTheDocument()
    const article = within(screen.getByRole('article'))
    expect(article.getByText(/jamais les données de carte/)).toBeInTheDocument()
    expect(article.getByRole('link', { name: /conditions d’utilisation/i })).toHaveAttribute(
      'href',
      '/cgu'
    )
    expect(article.getByRole('link', { name: /conditions de vente/i })).toHaveAttribute(
      'href',
      '/cgv'
    )
  })

  test('affiche les durées de conservation', () => {
    render(<PrivacyPolicy />)

    for (const period of RETENTION_PERIODS) {
      expect(screen.getByText(period.duration)).toBeInTheDocument()
    }
    expect(screen.getByText(RETENTION_NOTICE)).toBeInTheDocument()
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
