import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { ExperiencesCard } from '~/components/dashboard/employee/profile/experiences/experience_card/ExperiencesCard'
import { formSubmissions, resetInertiaMock, setInertiaOutcome } from '../../../../../../support/inertia_mock'
import { makeEmployee, makeExperience } from '../../../../../../support/factories'
import { renderWithUser } from '../../../../../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../../../support/inertia_mock')
  return inertiaMock()
})

describe('ExperiencesCard', () => {
  beforeEach(() => resetInertiaMock())

  test('affiche un état vide sans expérience', () => {
    renderWithUser(<ExperiencesCard employee={makeEmployee()} />)
    expect(screen.getByText('Aucune expérience renseignée.')).toBeInTheDocument()
  })

  test('trie par date de début décroissante, les dates nulles en dernier', () => {
    renderWithUser(
      <ExperiencesCard
        employee={makeEmployee({
          experiences: [
            makeExperience({ id: 1, title: 'Sans date', startDate: null as never }),
            makeExperience({ id: 2, title: 'Stagiaire', startDate: '2012-01-01' }),
            makeExperience({ id: 3, title: 'Sans date 2', startDate: null as never }),
            makeExperience({ id: 4, title: 'Manager', startDate: '2020-01-01' }),
          ],
        })}
      />
    )
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(titles.slice(0, 2)).toEqual(['Manager', 'Stagiaire'])
    expect(titles.slice(2).sort()).toEqual(['Sans date', 'Sans date 2'])
  })

  test('une seule expérience est éditée à la fois', async () => {
    const { user } = renderWithUser(
      <ExperiencesCard
        employee={makeEmployee({
          experiences: [
            makeExperience({ id: 1, title: 'Manager', startDate: '2020-01-01' }),
            makeExperience({ id: 2, title: 'Stagiaire', startDate: '2012-01-01' }),
          ],
        })}
      />
    )

    await user.click(screen.getAllByTitle('Modifier')[0])
    expect(screen.getByRole('textbox', { name: /Poste/ })).toHaveValue('Manager')
    expect(screen.getByRole('heading', { name: 'Stagiaire' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.getByRole('heading', { name: 'Manager' })).toBeInTheDocument()
  })

  test('« Ajouter une expérience » ouvre un formulaire vierge qui se ferme après création', async () => {
    setInertiaOutcome('success')
    const { user } = renderWithUser(
      <ExperiencesCard employee={makeEmployee({ experiences: [makeExperience()] })} />
    )

    await user.click(screen.getByRole('button', { name: 'Ajouter une expérience' }))
    await user.type(screen.getByRole('textbox', { name: /Poste/ }), 'Product Owner')
    await user.type(screen.getByRole('textbox', { name: /Entreprise/ }), 'Initech')
    await user.type(screen.getByRole('textbox', { name: /Date de début/ }), '02/2023')
    await user.click(screen.getByRole('button', { name: "Ajouter l'expérience" }))

    expect(formSubmissions.at(-1)).toMatchObject({ method: 'post', data: { title: 'Product Owner', type: 'cdi' } })
    expect(screen.queryByRole('button', { name: "Ajouter l'expérience" })).not.toBeInTheDocument()
  })

  test('Annuler referme le formulaire d’ajout', async () => {
    const { user } = renderWithUser(
      <ExperiencesCard employee={makeEmployee({ experiences: [makeExperience()] })} />
    )
    await user.click(screen.getByRole('button', { name: 'Ajouter une expérience' }))
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('button', { name: "Ajouter l'expérience" })).not.toBeInTheDocument()
  })
})
