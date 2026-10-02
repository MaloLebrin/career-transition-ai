import { describe, test, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import TermsOfService from '../../../inertia/pages/TermsOfService'
import { PRIVACY_CONTACT_EMAIL, TERMS_VERSION } from '#shared/constants/legal'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('TermsOfService page (/cgu, #95)', () => {
  test('rend le titre, la version et les sections clés', () => {
    render(<TermsOfService />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Conditions générales d’utilisation/i })
    ).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`Dernière mise à jour : ${TERMS_VERSION}`))
    ).toBeInTheDocument()
    for (const section of [
      /Éditeur et objet/,
      /Comptes et accès/,
      /intelligence artificielle/i,
      /Propriété intellectuelle/,
      /Résiliation/,
      /Droit applicable/,
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: section })).toBeInTheDocument()
    }
  })

  // Le pied de page public porte aussi des liens légaux : on lit le document seul.
  test('distingue cabinets et particuliers, exercices gratuits et forfait', () => {
    render(<TermsOfService />)
    const article = within(screen.getByRole('article'))

    expect(article.getByText('Cabinets')).toBeInTheDocument()
    expect(article.getByText('Particuliers')).toBeInTheDocument()
    expect(article.getByText(/Motivations et Valeurs sont gratuits/)).toBeInTheDocument()
    expect(article.getByRole('link', { name: /conditions générales de vente/i })).toHaveAttribute(
      'href',
      '/cgv'
    )
    expect(article.getByRole('link', { name: /politique de confidentialité/i })).toHaveAttribute(
      'href',
      '/confidentialite'
    )
  })

  test('signale la relecture juridique à faire et donne un contact', () => {
    render(<TermsOfService />)
    const article = within(screen.getByRole('article'))

    expect(article.getAllByText(/à valider par un conseil juridique/).length).toBeGreaterThan(0)
    expect(article.getByRole('link', { name: PRIVACY_CONTACT_EMAIL })).toHaveAttribute(
      'href',
      `mailto:${PRIVACY_CONTACT_EMAIL}`
    )
  })
})
