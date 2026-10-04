import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { EducationForm } from '~/components/dashboard/employee/profile/educations/EducationForm'
import {
  formSubmissions,
  resetInertiaMock,
  setInertiaOutcome,
} from '../../../../../support/inertia_mock'
import { makeEducation } from '../../../../../support/factories'
import { renderWithUser } from '../../../../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../../support/inertia_mock')
  return inertiaMock()
})

const emptyEducation = {
  degree: '',
  school: '',
  startDate: '',
  endDate: null,
  description: '',
  isCurrent: false,
  sortOrder: null,
}

describe('EducationForm', () => {
  beforeEach(() => resetInertiaMock())

  test('création : le bouton est désactivé tant que le formulaire est vierge', () => {
    renderWithUser(<EducationForm education={emptyEducation} />)
    expect(screen.getByRole('button', { name: 'Ajouter la formation' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Annuler' })).not.toBeInTheDocument()
  })

  test('création : envoie un POST avec les champs saisis puis appelle onSuccess', async () => {
    setInertiaOutcome('success')
    const onSuccess = vi.fn()
    const { user } = renderWithUser(
      <EducationForm education={emptyEducation} onSuccess={onSuccess} />
    )

    await user.type(screen.getByRole('textbox', { name: /Diplôme/ }), 'BTS SIO')
    await user.type(screen.getByRole('textbox', { name: /Ecole/ }), 'Lycée Pasteur')
    await user.type(screen.getByRole('textbox', { name: /Date de début/ }), '09/2019')
    await user.type(
      screen.getByPlaceholderText('Décrivez vos missions et réalisations...'),
      'Option SLAM'
    )
    await user.click(screen.getByRole('button', { name: 'Ajouter la formation' }))

    const submission = formSubmissions.at(-1)!
    expect(submission.method).toBe('post')
    expect(submission.url).toBe('/dashboard/candidat/educations')
    expect(submission.data).toMatchObject({
      id: undefined,
      degree: 'BTS SIO',
      school: 'Lycée Pasteur',
      startDate: '2019-09-01',
      description: 'Option SLAM',
      isCurrent: false,
    })
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  test('édition : pré-remplit les champs et envoie un PUT', async () => {
    const education = makeEducation({ id: 42, degree: 'Licence', school: 'Sorbonne' })
    const { user } = renderWithUser(<EducationForm education={education} onCancel={vi.fn()} />)

    const degree = screen.getByRole('textbox', { name: /Diplôme/ })
    expect(degree).toHaveValue('Licence')
    expect(screen.getByRole('textbox', { name: /Ecole/ })).toHaveValue('Sorbonne')

    await user.clear(degree)
    await user.type(degree, 'Licence Pro')
    await user.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }))

    const submission = formSubmissions.at(-1)!
    expect(submission.method).toBe('put')
    expect(submission.url).toBe('/dashboard/candidat/educations')
    expect(submission.data).toMatchObject({ id: 42, degree: 'Licence Pro', school: 'Sorbonne' })
  })

  test('cocher « Formation actuel » masque la date de fin et la remet à null', async () => {
    const education = makeEducation({ id: 3, endDate: '2017-06-01' })
    const { user } = renderWithUser(<EducationForm education={education} />)

    expect(screen.getByRole('textbox', { name: /Date de fin/ })).toBeInTheDocument()
    await user.click(screen.getByLabelText('Formation actuel'))
    expect(screen.queryByRole('textbox', { name: /Date de fin/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }))
    expect(formSubmissions.at(-1)!.data).toMatchObject({ isCurrent: true, endDate: null })
  })

  test('affiche les erreurs de validation renvoyées par le serveur', async () => {
    setInertiaOutcome({ errors: { degree: 'Le diplôme est requis', description: 'Trop long' } })
    const onSuccess = vi.fn()
    const { user } = renderWithUser(
      <EducationForm education={makeEducation({ id: 7 })} onSuccess={onSuccess} />
    )

    await user.type(screen.getByRole('textbox', { name: /Ecole/ }), ' bis')
    await user.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }))

    expect(await screen.findByText('Le diplôme est requis')).toBeInTheDocument()
    expect(screen.getByText('Trop long')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  test('le bouton Annuler appelle onCancel', async () => {
    const onCancel = vi.fn()
    const { user } = renderWithUser(
      <EducationForm education={makeEducation()} onCancel={onCancel} />
    )
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
