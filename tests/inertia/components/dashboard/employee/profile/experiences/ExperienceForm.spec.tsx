import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { ExperienceForm } from '~/components/dashboard/employee/profile/experiences/ExperienceForm'
import {
  formSubmissions,
  resetInertiaMock,
  setInertiaOutcome,
} from '../../../../../support/inertia_mock'
import { makeExperience } from '../../../../../support/factories'
import { renderWithUser } from '../../../../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../../support/inertia_mock')
  return inertiaMock()
})

const emptyExperience = {
  title: '',
  company: '',
  startDate: '',
  endDate: null,
  description: '',
  type: null,
  isCurrent: false,
  sortOrder: null,
}

describe('ExperienceForm', () => {
  beforeEach(() => resetInertiaMock())

  test('création : type de contrat CDI par défaut et bouton désactivé tant que rien n’est saisi', () => {
    renderWithUser(<ExperienceForm experience={emptyExperience} />)
    expect(screen.getByRole('combobox')).toHaveValue('cdi')
    expect(screen.getByRole('option', { name: 'FREELANCE' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: "Ajouter l'expérience" })).toBeDisabled()
  })

  test('création : envoie un POST avec le poste, l’entreprise, le type et les dates', async () => {
    setInertiaOutcome('success')
    const onSuccess = vi.fn()
    const { user } = renderWithUser(
      <ExperienceForm experience={emptyExperience} onSuccess={onSuccess} onCancel={vi.fn()} />
    )

    await user.type(screen.getByRole('textbox', { name: /Poste/ }), 'Développeur')
    await user.type(screen.getByRole('textbox', { name: /Entreprise/ }), 'Globex')
    await user.selectOptions(screen.getByRole('combobox'), 'freelance')
    await user.type(screen.getByRole('textbox', { name: /Date de début/ }), '01/2021')
    await user.type(screen.getByRole('textbox', { name: /Date de fin/ }), '12/2022')
    await user.type(
      screen.getByPlaceholderText('Décrivez vos missions et réalisations...'),
      'API REST'
    )
    await user.click(screen.getByRole('button', { name: "Ajouter l'expérience" }))

    const submission = formSubmissions.at(-1)!
    expect(submission.method).toBe('post')
    expect(submission.url).toBe('/dashboard/candidat/experiences')
    expect(submission.data).toMatchObject({
      title: 'Développeur',
      company: 'Globex',
      type: 'freelance',
      startDate: '2021-01-01',
      endDate: '2022-12-01',
      description: 'API REST',
      isCurrent: false,
    })
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  test('édition : normalise le type et les dates ISO puis envoie un PUT', async () => {
    const experience = makeExperience({
      id: 9,
      type: 'CDD' as never,
      startDate: '2019-03-01T00:00:00.000Z',
      endDate: '2020-04-01T00:00:00.000Z',
    })
    const { user } = renderWithUser(<ExperienceForm experience={experience} />)

    expect(screen.getByRole('combobox')).toHaveValue('cdd')
    await user.type(screen.getByRole('textbox', { name: /Entreprise/ }), ' SAS')
    await user.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }))

    expect(formSubmissions.at(-1)).toMatchObject({
      method: 'put',
      url: '/dashboard/candidat/experiences',
      data: { id: 9, company: 'Acme SAS', startDate: '2019-03-01', endDate: '2020-04-01' },
    })
  })

  test('« Poste actuel » masque la date de fin et la vide', async () => {
    const { user } = renderWithUser(<ExperienceForm experience={makeExperience({ id: 2 })} />)

    await user.click(screen.getByLabelText('Poste actuel'))
    expect(screen.queryByRole('textbox', { name: /Date de fin/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }))
    expect(formSubmissions.at(-1)!.data).toMatchObject({ isCurrent: true, endDate: '' })
  })

  test('affiche les erreurs serveur sur chaque champ', async () => {
    setInertiaOutcome({
      errors: { title: 'Poste requis', type: 'Type invalide', description: 'Trop court' },
    })
    const onSuccess = vi.fn()
    const { user } = renderWithUser(
      <ExperienceForm experience={makeExperience({ id: 2 })} onSuccess={onSuccess} />
    )

    await user.selectOptions(screen.getByRole('combobox'), 'interim')
    await user.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }))

    expect(screen.getByText('Poste requis')).toBeInTheDocument()
    expect(screen.getByText('Type invalide')).toBeInTheDocument()
    expect(screen.getByText('Trop court')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
