import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import { useState } from 'react'

import { ExperienceItem } from '~/components/dashboard/employee/profile/experiences/experience_card/ExperienceItem'
import type { EmployeeData } from '~/types/employee'
import {
  resetInertiaMock,
  routerSpies,
  setInertiaOutcome,
} from '../../../../../../support/inertia_mock'
import { makeExperience } from '../../../../../../support/factories'
import { renderWithUser } from '../../../../../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../../../support/inertia_mock')
  return inertiaMock()
})

function Harness({ experience }: { experience: EmployeeData['experiences'][number] }) {
  const [isEditing, setIsEditing] = useState(false)
  return <ExperienceItem experience={experience} isEditing={isEditing} setIsEditing={setIsEditing} />
}

describe('ExperienceItem', () => {
  beforeEach(() => resetInertiaMock())

  test('affiche le poste, le type de contrat, l’entreprise et la description', () => {
    renderWithUser(<Harness experience={makeExperience()} />)
    expect(screen.getByRole('heading', { name: 'Chef de projet' })).toBeInTheDocument()
    expect(screen.getByText('cdi')).toBeInTheDocument()
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('Pilotage de projets digitaux')).toBeInTheDocument()
  })

  test('n’affiche ni type ni description quand ils sont absents', () => {
    renderWithUser(<Harness experience={makeExperience({ type: null, description: '' })} />)
    expect(screen.queryByText('cdi')).not.toBeInTheDocument()
    expect(screen.queryByText('Pilotage de projets digitaux')).not.toBeInTheDocument()
  })

  test('affiche « aujourd’hui » pour un poste actuel qui a une date de fin', () => {
    renderWithUser(<Harness experience={makeExperience({ isCurrent: true })} />)
    expect(screen.getByText(/aujourd'hui/)).toBeInTheDocument()
  })

  test('le crayon bascule en mode édition via setIsEditing', async () => {
    const setIsEditing = vi.fn()
    const { user } = renderWithUser(
      <ExperienceItem experience={makeExperience()} isEditing={false} setIsEditing={setIsEditing} />
    )
    await user.click(screen.getByTitle('Modifier'))
    expect(setIsEditing).toHaveBeenCalledWith(true)
  })

  test('en mode édition, Annuler revient à l’affichage', async () => {
    const { user } = renderWithUser(<Harness experience={makeExperience()} />)
    await user.click(screen.getByTitle('Modifier'))
    expect(screen.getByRole('button', { name: 'Enregistrer les modifications' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.getByRole('heading', { name: 'Chef de projet' })).toBeInTheDocument()
  })

  test('en mode édition, un enregistrement réussi revient à l’affichage', async () => {
    setInertiaOutcome('success')
    const { user } = renderWithUser(<Harness experience={makeExperience()} />)
    await user.click(screen.getByTitle('Modifier'))
    await user.type(screen.getByRole('textbox', { name: /Entreprise/ }), ' Corp')
    await user.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }))
    expect(screen.getByRole('heading', { name: 'Chef de projet' })).toBeInTheDocument()
  })

  test('suppression confirmée : DELETE avec l’id de l’expérience', async () => {
    setInertiaOutcome('success')
    const { user } = renderWithUser(<Harness experience={makeExperience({ id: 12 })} />)

    await user.click(screen.getByTitle('Supprimer'))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Supprimer' }))

    expect(routerSpies.delete).toHaveBeenCalledWith(
      '/dashboard/candidat/experiences',
      expect.objectContaining({ data: { id: 12 } })
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('suppression en échec : message d’erreur affiché', async () => {
    setInertiaOutcome({ errors: { id: 'x' } })
    const { user } = renderWithUser(<Harness experience={makeExperience()} />)

    await user.click(screen.getByTitle('Supprimer'))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Supprimer' }))
    expect(screen.getByRole('alert')).toHaveTextContent("Impossible de supprimer l'expérience. Réessaie.")
  })

  test('annuler la suppression ferme la modale sans requête', async () => {
    const { user } = renderWithUser(<Harness experience={makeExperience()} />)

    await user.click(screen.getByTitle('Supprimer'))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(routerSpies.delete).not.toHaveBeenCalled()
  })

  test('pendant la suppression, un clic sur le fond ne ferme pas la modale', async () => {
    const { user } = renderWithUser(<Harness experience={makeExperience()} />)

    await user.click(screen.getByTitle('Supprimer'))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Supprimer' }))
    await user.click(dialog)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
