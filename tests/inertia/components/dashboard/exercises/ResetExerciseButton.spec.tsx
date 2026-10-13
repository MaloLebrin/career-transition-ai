import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen, within } from '@testing-library/react'

import { ResetExerciseButton } from '~/components/dashboard/exercises/ResetExerciseButton'
import { resetInertiaMock, routerSpies } from '../../../support/inertia_mock'
import { renderWithUser } from '../../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../support/inertia_mock')
  return inertiaMock()
})

describe('ResetExerciseButton (#72)', () => {
  beforeEach(() => resetInertiaMock())

  test('demande confirmation puis supprime les résultats du type', async () => {
    const { user } = renderWithUser(
      <ResetExerciseButton employeeId="5" type="values" exerciseTitle="Valeurs" />
    )

    await user.click(screen.getByRole('button', { name: 'Réinitialiser l’exercice' }))
    expect(routerSpies.delete).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/« Valeurs »/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Réinitialiser' }))

    expect(routerSpies.delete).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees/5/exercises/results/values',
      expect.objectContaining({ preserveScroll: true })
    )
  })

  test('annuler ne supprime rien', async () => {
    const { user } = renderWithUser(
      <ResetExerciseButton employeeId="5" type="values" exerciseTitle="Valeurs" />
    )

    await user.click(screen.getByRole('button', { name: 'Réinitialiser l’exercice' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuler' }))

    expect(routerSpies.delete).not.toHaveBeenCalled()
  })
})
