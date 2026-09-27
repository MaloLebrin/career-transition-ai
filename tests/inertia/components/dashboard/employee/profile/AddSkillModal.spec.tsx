import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import AddSkillModal from '~/components/dashboard/employee/profile/AddSkillModal'
import { resetInertiaMock } from '../../../../support/inertia_mock'
import { renderWithUser } from '../../../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

describe('AddSkillModal', () => {
  beforeEach(() => resetInertiaMock())

  test('affiche le titre et le formulaire de compétence', async () => {
    const { user } = renderWithUser(
      <AddSkillModal onClose={vi.fn()} availableSkills={[{ id: 1, name: 'SQL', category: 'Data' }]} />
    )
    expect(screen.getByRole('heading', { name: 'Ajouter une compétence' })).toBeInTheDocument()
    await user.type(screen.getByRole('combobox', { name: /Compétence/ }), 'sq')
    expect(await screen.findByRole('option', { name: /SQL/ })).toBeInTheDocument()
  })

  test('Annuler ferme la modale', async () => {
    const onClose = vi.fn()
    const { user } = renderWithUser(<AddSkillModal onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
