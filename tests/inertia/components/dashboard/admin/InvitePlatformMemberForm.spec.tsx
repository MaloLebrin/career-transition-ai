import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { InvitePlatformMemberForm } from '~/components/dashboard/admin/InvitePlatformMemberForm'
import { renderWithUser } from '../../../support/render'
import { formSubmissions, resetInertiaMock } from '../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../support/inertia_mock')
  return inertiaMock()
})

describe('InvitePlatformMemberForm (#105)', () => {
  beforeEach(() => resetInertiaMock())

  test('propose les rôles de l’équipe interne seulement et poste l’invitation', async () => {
    const { user } = renderWithUser(<InvitePlatformMemberForm />)

    const role = screen.getByRole('combobox', { name: 'Rôle' })
    const values = Array.from(role.querySelectorAll('option')).map((o) => o.getAttribute('value'))
    expect(values).toEqual(['advisor', 'expert', 'admin'])

    await user.type(screen.getByRole('textbox', { name: /Nom complet/ }), 'Nadia Experte')
    await user.type(screen.getByRole('textbox', { name: /E-mail/ }), 'nadia@plateforme.test')
    await user.selectOptions(role, 'expert')
    await user.click(screen.getByRole('button', { name: 'Inviter' }))

    expect(formSubmissions[0]).toMatchObject({
      method: 'post',
      url: '/dashboard/super-admin/team',
      data: { name: 'Nadia Experte', email: 'nadia@plateforme.test', role: 'expert' },
      options: { preserveScroll: true },
    })
  })
})
