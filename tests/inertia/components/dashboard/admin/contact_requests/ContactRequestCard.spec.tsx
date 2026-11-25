import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ContactRequestItem } from '#shared/types/contact_request/admin'

import { ContactRequestCard } from '../../../../../../inertia/components/dashboard/admin/contact_requests/ContactRequestCard'
import { resetInertiaMock, routerSpies } from '../../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

const REQUEST: ContactRequestItem = {
  id: 4,
  name: 'Marie Dupont',
  email: 'marie@cabinet.fr',
  phone: '0601020304',
  organization: 'Cabinet Test',
  message: 'Bonjour, je souhaite une démo.',
  type: 'demo',
  status: 'pending',
  createdAt: '2026-10-10T09:00:00.000Z',
  senderBlocked: false,
  account: null,
}

describe('ContactRequestCard', () => {
  beforeEach(() => resetInertiaMock())

  test('affiche coordonnées, message, type et statut', () => {
    render(<ContactRequestCard request={REQUEST} />)

    expect(screen.getByText('Marie Dupont')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'marie@cabinet.fr' })).toHaveAttribute(
      'href',
      'mailto:marie@cabinet.fr'
    )
    expect(screen.getByText(/0601020304/)).toBeInTheDocument()
    expect(screen.getByText('Bonjour, je souhaite une démo.')).toBeInTheDocument()
    expect(screen.getByText('Démo')).toBeInTheDocument()
    expect(screen.getByText('À traiter')).toBeInTheDocument()
  })

  test('les actions de statut dépendent du statut courant', async () => {
    render(<ContactRequestCard request={{ ...REQUEST, status: 'archived' }} />)

    expect(screen.queryByRole('button', { name: 'Archiver' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remettre à traiter' }))

    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/super-admin/contact-requests/4/status',
      { status: 'pending' },
      expect.objectContaining({ preserveScroll: true })
    )
  })

  test('porte les actions de blocage de l’expéditeur', () => {
    render(<ContactRequestCard request={{ ...REQUEST, senderBlocked: true }} />)

    expect(screen.getByText('Expéditeur bloqué')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Débloquer l’expéditeur' })).toBeInTheDocument()
  })
})
