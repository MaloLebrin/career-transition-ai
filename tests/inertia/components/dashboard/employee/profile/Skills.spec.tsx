import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { Skills } from '~/components/dashboard/employee/profile/Skills'
import { resetInertiaMock } from '../../../../support/inertia_mock'
import { makeEmployee } from '../../../../support/factories'
import { renderWithUser } from '../../../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

describe('Skills', () => {
  beforeEach(() => resetInertiaMock())

  test('affiche un état vide sans compétence', () => {
    renderWithUser(<Skills employee={makeEmployee()} />)
    expect(screen.getByText('Aucune compétence renseignée.')).toBeInTheDocument()
  })

  test('liste les compétences avec leur niveau', () => {
    renderWithUser(
      <Skills
        employee={makeEmployee({
          skills: [
            { id: 1, name: 'Excel', category: null, level: 4 },
            { id: 2, name: 'Négociation', category: 'Soft', level: 2 },
          ],
        })}
      />
    )
    expect(screen.getByText('Excel')).toBeInTheDocument()
    expect(screen.getByText('4/5')).toBeInTheDocument()
    expect(screen.getByText('2/5')).toBeInTheDocument()
  })

  test('ouvre puis ferme la modale d’ajout', async () => {
    const { user } = renderWithUser(<Skills employee={makeEmployee()} />)

    const addButton = screen.getByRole('button', { name: 'Ajouter' })
    await user.click(addButton)
    expect(screen.getByRole('heading', { name: 'Ajouter une compétence' })).toBeInTheDocument()
    expect(addButton).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('heading', { name: 'Ajouter une compétence' })).not.toBeInTheDocument()
  })
})
