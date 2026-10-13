import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen, within } from '@testing-library/react'

import { EmployeeAdvisorActions } from '~/components/dashboard/employee/EmployeeAdvisorActions'
import { resetInertiaMock, routerSpies } from '../../../support/inertia_mock'
import { renderWithUser } from '../../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../support/inertia_mock')
  return inertiaMock()
})

describe('EmployeeAdvisorActions (#72)', () => {
  beforeEach(() => resetInertiaMock())

  test('renvoyer l’invitation : visible tant que le candidat n’est pas onboardé', async () => {
    const { user } = renderWithUser(
      <EmployeeAdvisorActions employeeId="5" status="onboarding" onboarded={false} />
    )

    await user.click(screen.getByRole('button', { name: 'Renvoyer l’invitation' }))

    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees/5/onboarding/resend',
      {},
      { preserveScroll: true }
    )
  })

  test('pas de renvoi d’invitation pour un candidat déjà onboardé', () => {
    renderWithUser(<EmployeeAdvisorActions employeeId="5" status="active" onboarded />)

    expect(screen.queryByRole('button', { name: 'Renvoyer l’invitation' })).not.toBeInTheDocument()
  })

  test('archiver demande confirmation puis poste sur /archive', async () => {
    const { user } = renderWithUser(
      <EmployeeAdvisorActions employeeId="5" status="active" onboarded />
    )

    await user.click(screen.getByRole('button', { name: 'Archiver' }))
    expect(routerSpies.post).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Archiver' }))

    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees/5/archive',
      {},
      expect.objectContaining({ preserveScroll: true })
    )
  })

  test('annuler l’archivage ne poste rien', async () => {
    const { user } = renderWithUser(
      <EmployeeAdvisorActions employeeId="5" status="active" onboarded />
    )

    await user.click(screen.getByRole('button', { name: 'Archiver' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuler' }))

    expect(routerSpies.post).not.toHaveBeenCalled()
  })

  test('une fiche archivée propose Restaurer, sans confirmation', async () => {
    const { user } = renderWithUser(
      <EmployeeAdvisorActions employeeId="5" status="archived" onboarded />
    )

    expect(screen.queryByRole('button', { name: 'Archiver' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Restaurer' }))

    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees/5/restore',
      {},
      { preserveScroll: true }
    )
  })
})
