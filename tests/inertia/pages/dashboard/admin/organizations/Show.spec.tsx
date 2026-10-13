import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import OrganizationShow from '../../../../../../inertia/pages/dashboard/admin/organizations/Show'
import { formSubmissions, resetInertiaMock } from '../../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const ORGANIZATION = {
  id: 7,
  name: 'Cabinet Horizon',
  slug: 'horizon',
  createdAt: '2026-09-01T10:00:00.000Z',
  usersCount: 2,
  employeesCount: 12,
  members: [
    {
      id: 1,
      name: 'Alice Martin',
      email: 'alice@horizon.test',
      role: 'admin' as const,
      onboardingCompleted: true,
      disabledAt: null,
    },
    {
      id: 2,
      name: 'Bob Leroy',
      email: 'bob@horizon.test',
      role: 'advisor' as const,
      onboardingCompleted: true,
      disabledAt: '2026-10-01T10:00:00.000Z',
    },
  ],
}

describe('OrganizationShow page (#73)', () => {
  beforeEach(() => resetInertiaMock())

  test('affiche compteurs, membres et état d’accès', () => {
    render(<OrganizationShow organization={ORGANIZATION} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Cabinet Horizon' })).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'Membres de l’organisation' })
    expect(within(table).getByText('alice@horizon.test')).toBeInTheDocument()
    expect(within(table).getByText('Actif')).toBeInTheDocument()
    expect(within(table).getByText('Désactivé')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Organisations/ })).toHaveAttribute(
      'href',
      '/dashboard/super-admin/organizations'
    )
  })

  test('renommer envoie un PUT ; le bouton reste inactif tant que rien ne change', async () => {
    const user = userEvent.setup()
    render(<OrganizationShow organization={ORGANIZATION} />)
    const form = screen.getByRole('form', { name: 'Modifier l’organisation' })
    const save = within(form).getByRole('button', { name: 'Enregistrer' })
    expect(save).toBeDisabled()

    const name = within(form).getByRole('textbox', { name: /Nom du cabinet/ })
    await user.clear(name)
    await user.type(name, 'Cabinet Horizon Plus')
    expect(save).toBeEnabled()
    await user.click(save)

    expect(formSubmissions.at(-1)).toMatchObject({
      method: 'put',
      url: '/dashboard/super-admin/organizations/7',
      data: { name: 'Cabinet Horizon Plus', slug: 'horizon' },
    })
  })
})
