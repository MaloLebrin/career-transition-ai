import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ContactRequestItem } from '#shared/types/contact_request/admin'

import { ContactRequestSenderActions } from '../../../../../../inertia/components/dashboard/admin/contact_requests/ContactRequestSenderActions'
import { resetInertiaMock, routerSpies } from '../../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

const REQUEST: ContactRequestItem = {
  id: 4,
  name: 'Marie Dupont',
  email: 'marie@cabinet.fr',
  phone: null,
  organization: null,
  message: 'Bonjour, je souhaite une démo.',
  type: 'demo',
  status: 'pending',
  createdAt: '2026-10-10T09:00:00.000Z',
  senderBlocked: false,
  account: null,
  ambiguousAccount: false,
}

const ACCOUNT = {
  id: 9,
  name: 'Marie Dupont',
  role: 'employee' as const,
  disabled: false,
  canDisable: true,
}

describe('ContactRequestSenderActions', () => {
  beforeEach(() => resetInertiaMock())

  test('sans compte : propose seulement de bloquer l’expéditeur', () => {
    render(<ContactRequestSenderActions request={REQUEST} />)

    expect(screen.getByText('Aucun compte avec cette adresse')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bloquer l’expéditeur' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Désactiver le compte' })).not.toBeInTheDocument()
  })

  test('plusieurs comptes pour l’adresse : renvoie vers la page des comptes, sans action de compte', () => {
    render(<ContactRequestSenderActions request={{ ...REQUEST, ambiguousAccount: true }} />)

    expect(screen.getByText(/Plusieurs comptes portent cette adresse/)).toBeInTheDocument()
    expect(screen.queryByText('Aucun compte avec cette adresse')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Désactiver le compte' })).not.toBeInTheDocument()
  })

  test('bloquer demande confirmation puis poste sur la route de blocage', async () => {
    const user = userEvent.setup()
    render(<ContactRequestSenderActions request={REQUEST} />)

    await user.click(screen.getByRole('button', { name: 'Bloquer l’expéditeur' }))
    expect(routerSpies.post).not.toHaveBeenCalled()
    expect(screen.getByText('Bloquer cet expéditeur ?')).toBeInTheDocument()
    expect(screen.getByText(/marie@cabinet\.fr seront ignorées/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Bloquer' }))
    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/super-admin/contact-requests/4/block-sender',
      {},
      expect.objectContaining({ preserveScroll: true, only: ['requests'] })
    )
  })

  test('expéditeur bloqué : badge et déblocage direct', async () => {
    render(<ContactRequestSenderActions request={{ ...REQUEST, senderBlocked: true }} />)

    expect(screen.getByText('Expéditeur bloqué')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Débloquer l’expéditeur' }))

    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/super-admin/contact-requests/4/unblock-sender',
      {},
      expect.anything()
    )
  })

  test('compte existant : désactivation après confirmation', async () => {
    const user = userEvent.setup()
    render(<ContactRequestSenderActions request={{ ...REQUEST, account: ACCOUNT }} />)

    expect(screen.getByText('Compte : Marie Dupont · Talent')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Désactiver le compte' }))
    expect(screen.getByText('Désactiver ce compte ?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Désactiver' }))
    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/super-admin/contact-requests/4/disable-account',
      {},
      expect.objectContaining({ preserveScroll: true })
    )
  })

  test('compte désactivé : badge et réactivation directe', async () => {
    render(
      <ContactRequestSenderActions
        request={{ ...REQUEST, account: { ...ACCOUNT, disabled: true } }}
      />
    )

    expect(screen.getByText('Compte désactivé')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Réactiver le compte' }))

    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/super-admin/contact-requests/4/enable-account',
      {},
      expect.anything()
    )
  })

  test('compte non désactivable (équipe plateforme, super admin) : aucune action de compte', () => {
    render(
      <ContactRequestSenderActions
        request={{ ...REQUEST, account: { ...ACCOUNT, role: 'super_admin', canDisable: false } }}
      />
    )

    expect(screen.getByText('Compte : Marie Dupont · Super admin')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Désactiver le compte' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Réactiver le compte' })).not.toBeInTheDocument()
  })
})
