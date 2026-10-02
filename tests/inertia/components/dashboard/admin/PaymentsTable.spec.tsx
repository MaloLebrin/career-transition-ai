import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import { PaymentsTable } from '~/components/dashboard/admin/PaymentsTable'
import type { PaymentRow } from '#shared/types/billing/admin'
import { renderWithUser } from '../../../support/render'
import { formSubmissions, resetInertiaMock } from '../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../support/inertia_mock')
  return inertiaMock()
})

const paid: PaymentRow = {
  id: 11,
  candidate: { id: 1, name: 'Camille Durand', email: 'camille@example.test' },
  provider: 'stripe',
  status: 'paid',
  amountCents: 4900,
  currency: 'eur',
  paidAt: '2026-10-02T10:00:00.000Z',
  refundedAt: null,
  revokedAt: null,
  revokeReason: null,
  grantedBy: null,
  revokedBy: null,
  createdAt: '2026-10-02T09:59:00.000Z',
  grantsAccess: true,
}
const manualRevoked: PaymentRow = {
  ...paid,
  id: 12,
  candidate: null,
  provider: 'manual',
  amountCents: 0,
  revokedAt: '2026-10-03T10:00:00.000Z',
  revokeReason: 'Litige (par l’utilisateur #1)',
  grantedBy: { id: 1, name: 'Super Admin' },
  revokedBy: null,
  grantsAccess: false,
}

describe('PaymentsTable (#107)', () => {
  beforeEach(() => resetInertiaMock())

  test('sans paiement : état vide', () => {
    render(<PaymentsTable payments={[]} />)
    expect(screen.getByRole('status')).toHaveTextContent('Aucun paiement pour ce filtre.')
  })

  test('affiche candidat, montant, origine, statut, retrait et compte supprimé', () => {
    render(<PaymentsTable payments={[paid, manualRevoked]} />)

    const rows = within(screen.getByRole('table', { name: 'Paiements du forfait' }))
      .getAllByRole('row')
      .slice(1)
    expect(rows[0]).toHaveTextContent('Camille Durand')
    expect(rows[0]).toHaveTextContent(/49/)
    expect(rows[0]).toHaveTextContent('Stripe')
    expect(rows[0]).toHaveTextContent('Payé')
    expect(within(rows[0]).getByRole('button', { name: 'Retirer l’accès' })).toBeInTheDocument()
    expect(rows[1]).toHaveTextContent('Compte supprimé (pièce comptable conservée)')
    expect(rows[1]).toHaveTextContent('Octroi manuel · Super Admin')
    expect(rows[1]).toHaveTextContent('Accès retiré')
    expect(rows[1]).toHaveTextContent('Litige (par l’utilisateur #1)')
    expect(within(rows[1]).queryByRole('button')).not.toBeInTheDocument()
  })

  test('retirer l’accès : motif saisi puis POST sur la route de révocation', async () => {
    const { user } = renderWithUser(<PaymentsTable payments={[paid]} />)

    await user.click(screen.getByRole('button', { name: 'Retirer l’accès' }))
    await user.type(screen.getByRole('textbox', { name: /Motif du retrait/ }), 'Paiement contesté.')
    await user.click(screen.getByRole('button', { name: 'Confirmer le retrait' }))

    expect(formSubmissions[0]).toMatchObject({
      method: 'post',
      url: '/dashboard/super-admin/payments/11/revoke',
      data: { reason: 'Paiement contesté.' },
      options: { preserveScroll: true },
    })
  })
})
