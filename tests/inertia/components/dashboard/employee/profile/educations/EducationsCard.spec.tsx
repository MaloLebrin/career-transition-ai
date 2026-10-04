import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { EducationsCard } from '~/components/dashboard/employee/profile/educations/EducationsCard'
import {
  formSubmissions,
  resetInertiaMock,
  setInertiaOutcome,
} from '../../../../../support/inertia_mock'
import { makeEducation, makeEmployee } from '../../../../../support/factories'
import { renderWithUser } from '../../../../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../../support/inertia_mock')
  return inertiaMock()
})

describe('EducationsCard', () => {
  beforeEach(() => resetInertiaMock())

  test('affiche un état vide sans formation', () => {
    renderWithUser(<EducationsCard employee={makeEmployee()} />)
    expect(screen.getByText('Aucune formation renseignée.')).toBeInTheDocument()
  })

  test('trie les formations de la plus récente à la plus ancienne', () => {
    renderWithUser(
      <EducationsCard
        employee={makeEmployee({
          educations: [
            makeEducation({ id: 1, degree: 'Bac', startDate: '2010-09-01' }),
            makeEducation({ id: 2, degree: 'Master', startDate: '2015-09-01' }),
            makeEducation({ id: 3, degree: 'Licence', startDate: '2012-09-01' }),
          ],
        })}
      />
    )
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual(['Master', 'Licence', 'Bac'])
  })

  test('« Ajouter une formation » ouvre un formulaire vierge qui se ferme après création', async () => {
    setInertiaOutcome('success')
    const { user } = renderWithUser(
      <EducationsCard employee={makeEmployee({ educations: [makeEducation()] })} />
    )

    const addButton = screen.getByRole('button', { name: 'Ajouter une formation' })
    await user.click(addButton)
    expect(addButton).toBeDisabled()

    await user.type(screen.getByRole('textbox', { name: /Diplôme/ }), 'DUT GEA')
    await user.type(screen.getByRole('textbox', { name: /Ecole/ }), 'IUT Nantes')
    await user.type(screen.getByRole('textbox', { name: /Date de début/ }), '09/2018')
    await user.click(screen.getByRole('button', { name: 'Ajouter la formation' }))

    expect(formSubmissions.at(-1)).toMatchObject({ method: 'post', data: { degree: 'DUT GEA' } })
    expect(screen.queryByRole('button', { name: 'Ajouter la formation' })).not.toBeInTheDocument()
    expect(addButton).toBeEnabled()
  })

  test('Annuler referme le formulaire d’ajout', async () => {
    const { user } = renderWithUser(
      <EducationsCard employee={makeEmployee({ educations: [makeEducation()] })} />
    )
    await user.click(screen.getByRole('button', { name: 'Ajouter une formation' }))
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('button', { name: 'Ajouter la formation' })).not.toBeInTheDocument()
  })
})
