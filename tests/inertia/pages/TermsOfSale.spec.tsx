import { describe, test, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import TermsOfSale from '../../../inertia/pages/TermsOfSale'
import { SELLER_IDENTITY, TERMS_VERSION, WITHDRAWAL_NOTICE } from '#shared/constants/legal'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('TermsOfSale page (/cgv, #95)', () => {
  test('rend le titre, la version et les sections d’une vente à distance', () => {
    render(<TermsOfSale />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Conditions générales de vente/i })
    ).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`Dernière mise à jour : ${TERMS_VERSION}`))
    ).toBeInTheDocument()
    for (const section of [
      /^Vendeur$/,
      /Objet du forfait/,
      /Prix et paiement/,
      /Livraison/,
      /Droit de rétractation/,
      /Remboursement/,
      /Garanties/,
      /Réclamation et médiation/,
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: section })).toBeInTheDocument()
    }
  })

  test('identité du vendeur, prix TTC, Stripe et facture', () => {
    render(<TermsOfSale />)

    expect(screen.getAllByText(new RegExp(SELLER_IDENTITY.name)).length).toBeGreaterThan(0)
    expect(screen.getByText(SELLER_IDENTITY.siren)).toBeInTheDocument()
    expect(screen.getByText('toutes taxes comprises')).toBeInTheDocument()
    expect(screen.getByText(/prestataire Stripe/)).toBeInTheDocument()
    expect(screen.getByText(/Une facture est émise par Stripe/)).toBeInTheDocument()
    expect(screen.getByText('paiement unique')).toBeInTheDocument()
  })

  test('information de rétractation L221-28 13° et perte de l’accès au remboursement', () => {
    render(<TermsOfSale />)

    expect(screen.getByText(WITHDRAWAL_NOTICE)).toBeInTheDocument()
    expect(
      screen.getByText(/l’accès aux contenus débloqués par le forfait est retiré/)
    ).toBeInTheDocument()
    expect(screen.getAllByText(/à valider par un conseil juridique/).length).toBeGreaterThan(0)
  })

  // Le pied de page public porte aussi des liens légaux : on lit le document seul.
  test('renvoie vers les CGU et la politique de confidentialité', () => {
    render(<TermsOfSale />)
    const article = within(screen.getByRole('article'))

    expect(
      article.getByRole('link', { name: /conditions générales d’utilisation/i })
    ).toHaveAttribute('href', '/cgu')
    expect(article.getByRole('link', { name: /politique de confidentialité/i })).toHaveAttribute(
      'href',
      '/confidentialite'
    )
  })
})
