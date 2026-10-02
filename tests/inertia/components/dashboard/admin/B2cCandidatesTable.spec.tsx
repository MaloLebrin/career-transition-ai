import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import { B2cCandidatesTable } from '~/components/dashboard/admin/B2cCandidatesTable'
import type { B2cCandidateRow } from '#shared/types/billing/admin'
import { renderWithUser } from '../../../support/render'
import { resetInertiaMock, routerSpies } from '../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../support/inertia_mock')
  return inertiaMock()
})

const paid: B2cCandidateRow = {
  id: 1,
  name: 'Camille Durand',
  email: 'camille@example.test',
  emailVerified: true,
  createdAt: '2026-10-02T10:00:00.000Z',
  hasPaidAccess: true,
  activePaymentId: 11,
  expert: { id: 7, name: 'Nadia Experte' },
  pendingExpertRequest: false,
}
const free: B2cCandidateRow = {
  ...paid,
  id: 2,
  name: 'Bruno Petit',
  email: 'bruno@example.test',
  emailVerified: false,
  hasPaidAccess: false,
  activePaymentId: null,
  expert: null,
  pendingExpertRequest: true,
}

describe('B2cCandidatesTable (#107)', () => {
  beforeEach(() => resetInertiaMock())

  test('sans particulier : état vide', () => {
    render(<B2cCandidatesTable candidates={[]} />)
    expect(screen.getByRole('status')).toHaveTextContent('Aucun particulier inscrit')
  })

  test('affiche droit, expert, demande en attente et e-mail non vérifié', () => {
    render(<B2cCandidatesTable candidates={[paid, free]} />)

    const rows = within(screen.getByRole('table', { name: 'Particuliers inscrits' }))
      .getAllByRole('row')
      .slice(1)
    expect(rows[0]).toHaveTextContent('Réglé')
    expect(rows[0]).toHaveTextContent('Nadia Experte')
    expect(within(rows[0]).queryByRole('button')).not.toBeInTheDocument()
    expect(rows[1]).toHaveTextContent('Gratuit')
    expect(rows[1]).toHaveTextContent('Demande en attente')
    expect(rows[1]).toHaveTextContent('e-mail non vérifié')
    expect(within(rows[1]).getByRole('button', { name: 'Ouvrir l’accès' })).toBeInTheDocument()
  })

  test('ouvrir l’accès : confirmation puis POST sur la route d’octroi', async () => {
    const { user } = renderWithUser(<B2cCandidatesTable candidates={[free]} />)

    await user.click(screen.getByRole('button', { name: 'Ouvrir l’accès' }))
    expect(
      screen.getByText(/Un paiement manuel à 0 € sera enregistré pour Bruno Petit/)
    ).toBeInTheDocument()
    const confirm = screen.getAllByRole('button', { name: 'Ouvrir l’accès' }).at(-1)!
    await user.click(confirm)

    expect(routerSpies.post).toHaveBeenCalledTimes(1)
    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/super-admin/b2c/2/entitlement/grant',
      {},
      expect.objectContaining({ preserveScroll: true })
    )
  })
})
