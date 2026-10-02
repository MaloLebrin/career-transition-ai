import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { RevokePaymentForm } from '~/components/dashboard/admin/RevokePaymentForm'
import { renderWithUser } from '../../../support/render'
import { formSubmissions, resetInertiaMock } from '../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../support/inertia_mock')
  return inertiaMock()
})

describe('RevokePaymentForm (#107)', () => {
  beforeEach(() => resetInertiaMock())

  test('motif obligatoire, annulation, envoi', async () => {
    const onCancel = vi.fn()
    const { user } = renderWithUser(<RevokePaymentForm paymentId={5} onCancel={onCancel} />)

    expect(screen.getByRole('textbox', { name: /Motif du retrait/ })).toBeRequired()
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(onCancel).toHaveBeenCalledTimes(1)

    await user.type(screen.getByRole('textbox', { name: /Motif du retrait/ }), 'Litige.')
    await user.click(screen.getByRole('button', { name: 'Confirmer le retrait' }))
    expect(formSubmissions[0]).toMatchObject({
      method: 'post',
      url: '/dashboard/super-admin/payments/5/revoke',
      data: { reason: 'Litige.' },
    })
  })
})
