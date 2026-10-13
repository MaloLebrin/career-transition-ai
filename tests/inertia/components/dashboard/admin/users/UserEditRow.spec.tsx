import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UserListItem } from '#shared/types/super_admin/lists'

import { UserEditRow } from '../../../../../../inertia/components/dashboard/admin/users/UserEditRow'
import { formSubmissions, resetInertiaMock } from '../../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

const USER: UserListItem = {
  id: 5,
  name: 'Alice Martin',
  email: 'alice@horizon.test',
  role: 'advisor',
  organization: null,
  createdAt: null,
  onboardingCompleted: true,
  disabledAt: null,
}

function renderRow(onClose = vi.fn()) {
  render(
    <table>
      <tbody>
        <UserEditRow user={USER} colSpan={6} onClose={onClose} />
      </tbody>
    </table>
  )
  return { onClose, form: screen.getByRole('form', { name: 'Modifier Alice Martin' }) }
}

describe('UserEditRow (#73)', () => {
  beforeEach(() => resetInertiaMock())

  test('pré-remplit nom et e-mail et envoie un PUT', async () => {
    const user = userEvent.setup()
    const { form } = renderRow()

    const name = within(form).getByRole('textbox', { name: /Nom/ })
    expect(name).toHaveValue('Alice Martin')
    await user.clear(name)
    await user.type(name, 'Alice Durand')
    await user.click(within(form).getByRole('button', { name: 'Enregistrer' }))

    expect(formSubmissions.at(-1)).toMatchObject({
      method: 'put',
      url: '/dashboard/super-admin/users/5',
      data: { name: 'Alice Durand', email: 'alice@horizon.test' },
    })
  })

  test('prévient qu’un nouvel e-mail doit être reconfirmé', async () => {
    const user = userEvent.setup()
    const { form } = renderRow()
    expect(screen.queryByText(/reconfirmer/)).not.toBeInTheDocument()

    const email = within(form).getByRole('textbox', { name: /E-mail/ })
    await user.clear(email)
    await user.type(email, 'nouveau@horizon.test')

    expect(screen.getByText('Changer l’adresse oblige à la reconfirmer.')).toBeInTheDocument()
  })

  test('Annuler ferme la ligne', async () => {
    const { onClose, form } = renderRow()

    await userEvent.click(within(form).getByRole('button', { name: 'Annuler' }))

    expect(onClose).toHaveBeenCalled()
  })
})
