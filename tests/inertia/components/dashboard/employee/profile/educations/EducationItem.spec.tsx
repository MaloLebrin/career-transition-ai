import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen, within } from '@testing-library/react'

import { EducationItem } from '~/components/dashboard/employee/profile/educations/EducationItem'
import {
  resetInertiaMock,
  routerSpies,
  setInertiaOutcome,
} from '../../../../../support/inertia_mock'
import { makeEducation } from '../../../../../support/factories'
import { renderWithUser } from '../../../../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../../support/inertia_mock')
  return inertiaMock()
})

describe('EducationItem', () => {
  beforeEach(() => resetInertiaMock())

  test('affiche le diplôme, l’école, la période et la description', () => {
    renderWithUser(<EducationItem education={makeEducation()} />)
    expect(screen.getByRole('heading', { name: 'Master Management' })).toBeInTheDocument()
    expect(screen.getByText('IAE Lyon')).toBeInTheDocument()
    expect(screen.getByText('Spécialité RH')).toBeInTheDocument()
    expect(screen.queryByText("Aujourd'hui")).not.toBeInTheDocument()
  })

  test('affiche « Aujourd’hui » sans date de fin et masque une description vide', () => {
    renderWithUser(<EducationItem education={makeEducation({ endDate: null, description: '' })} />)
    expect(screen.getByText("Aujourd'hui")).toBeInTheDocument()
    expect(screen.queryByText('Spécialité RH')).not.toBeInTheDocument()
  })

  test('le crayon ouvre le formulaire d’édition, Annuler le referme', async () => {
    const { user } = renderWithUser(<EducationItem education={makeEducation()} />)

    await user.click(screen.getByTitle('Modifier'))
    expect(
      screen.getByRole('button', { name: 'Enregistrer les modifications' })
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.getByRole('heading', { name: 'Master Management' })).toBeInTheDocument()
  })

  test('le formulaire d’édition se referme après un enregistrement réussi', async () => {
    setInertiaOutcome('success')
    const { user } = renderWithUser(<EducationItem education={makeEducation()} />)

    await user.click(screen.getByTitle('Modifier'))
    await user.type(screen.getByRole('textbox', { name: /Ecole/ }), ' 3')
    await user.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }))

    expect(
      screen.queryByRole('button', { name: 'Enregistrer les modifications' })
    ).not.toBeInTheDocument()
  })

  test('suppression confirmée : DELETE avec l’id puis fermeture de la modale', async () => {
    setInertiaOutcome('success')
    const { user } = renderWithUser(<EducationItem education={makeEducation({ id: 5 })} />)

    await user.click(screen.getByTitle('Supprimer'))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Supprimer la formation')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Supprimer' }))

    expect(routerSpies.delete).toHaveBeenCalledWith(
      '/dashboard/candidat/educations',
      expect.objectContaining({ data: { id: 5 } })
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('suppression en échec : affiche un message d’erreur dans la modale', async () => {
    setInertiaOutcome({ errors: { id: 'introuvable' } })
    const { user } = renderWithUser(<EducationItem education={makeEducation()} />)

    await user.click(screen.getByTitle('Supprimer'))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Supprimer' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Impossible de supprimer la formation. Réessaie.'
    )
  })

  test('annuler la suppression ferme la modale sans requête', async () => {
    const { user } = renderWithUser(<EducationItem education={makeEducation()} />)

    await user.click(screen.getByTitle('Supprimer'))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuler' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(routerSpies.delete).not.toHaveBeenCalled()
  })

  test('pendant la suppression, Annuler ne ferme pas la modale', async () => {
    const { user } = renderWithUser(<EducationItem education={makeEducation()} />)

    await user.click(screen.getByTitle('Supprimer'))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Supprimer' }))
    // La requête reste en vol : on clique sur le fond (backdrop) pour tenter de fermer
    await user.click(dialog)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
