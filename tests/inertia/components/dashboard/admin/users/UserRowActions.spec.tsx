import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UserListItem } from '#shared/types/super_admin/lists'

import { UserRowActions } from '../../../../../../inertia/components/dashboard/admin/users/UserRowActions'
import { resetInertiaMock, routerSpies } from '../../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

const USER: UserListItem = {
  id: 5,
  name: 'Alice Martin',
  email: 'alice@horizon.test',
  role: 'advisor',
  organization: { id: 7, name: 'Cabinet Horizon' },
  createdAt: null,
  onboardingCompleted: true,
  disabledAt: null,
}

describe('UserRowActions (#73)', () => {
  beforeEach(() => resetInertiaMock())

  test('Modifier appelle onEdit avec l’utilisateur', async () => {
    const onEdit = vi.fn()
    render(<UserRowActions user={USER} currentUserId={1} onEdit={onEdit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Modifier' }))

    expect(onEdit).toHaveBeenCalledWith(USER)
  })

  test('Désactiver demande confirmation puis poste sur la route de désactivation', async () => {
    const user = userEvent.setup()
    render(<UserRowActions user={USER} currentUserId={1} onEdit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Désactiver' }))
    expect(routerSpies.post).not.toHaveBeenCalled()
    expect(screen.getByText('Désactiver ce compte ?')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Désactiver' }).at(-1)!)
    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/super-admin/users/5/disable',
      {},
      expect.objectContaining({ preserveScroll: true })
    )
  })

  test('un compte désactivé se réactive directement', async () => {
    render(
      <UserRowActions
        user={{ ...USER, disabledAt: '2026-10-01T10:00:00.000Z' }}
        currentUserId={1}
        onEdit={vi.fn()}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Réactiver' }))

    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/super-admin/users/5/enable',
      {},
      expect.anything()
    )
    expect(screen.queryByRole('button', { name: 'Désactiver' })).not.toBeInTheDocument()
  })

  test('Supprimer demande confirmation puis envoie un DELETE', async () => {
    const user = userEvent.setup()
    render(<UserRowActions user={USER} currentUserId={1} onEdit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Supprimer' }))
    expect(screen.getByText('Supprimer ce compte ?')).toBeInTheDocument()
    expect(routerSpies.delete).not.toHaveBeenCalled()

    await user.click(screen.getAllByRole('button', { name: 'Supprimer' }).at(-1)!)
    expect(routerSpies.delete).toHaveBeenCalledWith(
      '/dashboard/super-admin/users/5',
      expect.objectContaining({ preserveScroll: true })
    )
  })

  test('son propre compte et un super admin : ni désactivation ni suppression', () => {
    const { rerender } = render(<UserRowActions user={USER} currentUserId={5} onEdit={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Désactiver' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()

    rerender(
      <UserRowActions user={{ ...USER, role: 'super_admin' }} currentUserId={1} onEdit={vi.fn()} />
    )
    expect(screen.queryByRole('button', { name: 'Désactiver' })).not.toBeInTheDocument()
  })
})
