import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'

import { TeamMember } from '~/components/dashboard/settings/team/TeamMember'
import { resetInertiaMock, routerSpies } from '../../../support/inertia_mock'
import { renderWithUser } from '../../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../support/inertia_mock')
  return inertiaMock()
})

const base = { organizationId: 1, email: 'claire@example.com' }
const claire = { ...base, id: 7, name: 'Claire Martin', role: 'advisor' as const }
const paul = { ...base, id: 8, name: 'Paul Durand', role: 'admin' as const, email: 'p@example.com' }

describe('TeamMember (#71)', () => {
  beforeEach(() => resetInertiaMock())

  test('affiche le rôle en français (plus de « Inconnu » pour un conseiller)', () => {
    renderWithUser(<TeamMember member={claire} />)

    expect(screen.getByText('Conseiller')).toBeInTheDocument()
    expect(screen.queryByText('Inconnu')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test('sans droit de gestion ou pour soi-même : aucune action', () => {
    const { unmount } = renderWithUser(<TeamMember member={claire} canManage={false} />)
    expect(screen.queryByRole('button', { name: 'Retirer l’accès' })).not.toBeInTheDocument()
    unmount()

    renderWithUser(<TeamMember member={claire} isMe canManage />)
    expect(screen.getByText('Moi')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retirer l’accès' })).not.toBeInTheDocument()
  })

  test('retirer l’accès demande confirmation puis poste sur /disable', async () => {
    const { user } = renderWithUser(<TeamMember member={claire} canManage />)

    await user.click(screen.getByRole('button', { name: 'Retirer l’accès' }))
    expect(routerSpies.post).not.toHaveBeenCalled()
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Retirer l’accès' })
    )

    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/conseiller/settings/organization/members/7/disable',
      {},
      expect.objectContaining({ preserveScroll: true })
    )
  })

  test('un membre désactivé est signalé et peut être rétabli', async () => {
    const { user } = renderWithUser(
      <TeamMember member={{ ...claire, disabledAt: '2026-10-13T10:00:00.000Z' }} canManage />
    )

    expect(screen.getByText('Accès retiré')).toBeInTheDocument()
    expect(screen.queryByLabelText('Rôle de Claire Martin')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Rétablir l’accès' }))

    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/conseiller/settings/organization/members/7/enable',
      {},
      { preserveScroll: true }
    )
  })

  test('changer le rôle envoie un PUT /role', () => {
    renderWithUser(<TeamMember member={claire} canManage />)

    fireEvent.change(screen.getByLabelText('Rôle de Claire Martin'), { target: { value: 'admin' } })

    expect(routerSpies.put).toHaveBeenCalledWith(
      '/dashboard/conseiller/settings/organization/members/7/role',
      { role: 'admin' },
      { preserveScroll: true }
    )
  })

  test('réassigner ses candidats : destinataire obligatoire, autres membres seulement', async () => {
    const { user } = renderWithUser(
      <TeamMember member={claire} canManage colleagues={[claire, paul]} />
    )
    const picker = screen.getByLabelText('Réassigner les candidats de Claire Martin à')

    expect(within(picker).queryByRole('option', { name: 'Claire Martin' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Réassigner' })).toBeDisabled()

    fireEvent.change(picker, { target: { value: '8' } })
    await user.click(screen.getByRole('button', { name: 'Réassigner' }))

    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/conseiller/settings/organization/members/7/reassign',
      { toUserId: 8 },
      expect.objectContaining({ preserveScroll: true })
    )
  })
})
