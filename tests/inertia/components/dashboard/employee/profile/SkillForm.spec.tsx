import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import SkillForm from '~/components/dashboard/employee/profile/SkillForm'
import { formSubmissions, resetInertiaMock, setInertiaOutcome } from '../../../../support/inertia_mock'
import { renderWithUser } from '../../../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

const availableSkills = [
  { id: 1, name: 'TypeScript', category: 'Frontend' },
  { id: 2, name: 'Écoute active', category: null },
]

describe('SkillForm', () => {
  beforeEach(() => resetInertiaMock())

  test('le bouton Ajouter est désactivé tant qu’aucune compétence n’est choisie', () => {
    renderWithUser(<SkillForm onCancel={vi.fn()} availableSkills={availableSkills} />)
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeDisabled()
    expect(screen.getByText('Tape pour rechercher ou créer une nouvelle compétence')).toBeInTheDocument()
  })

  test('sélection d’une compétence existante : POST avec nom, catégorie et niveau choisi', async () => {
    setInertiaOutcome('success')
    const onCancel = vi.fn()
    const { user } = renderWithUser(<SkillForm onCancel={onCancel} availableSkills={availableSkills} />)

    await user.type(screen.getByRole('combobox', { name: /Compétence/ }), 'Type')
    await user.click(await screen.findByRole('option', { name: /TypeScript/ }))
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(formSubmissions.at(-1)).toMatchObject({
      method: 'post',
      url: '/dashboard/candidat/skills',
      data: { name: 'TypeScript', category: 'Frontend', level: 5 },
    })
    // onSuccess : le formulaire se réinitialise et se ferme
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeDisabled()
  })

  test('compétence sans catégorie : catégorie envoyée vide et niveau 3 par défaut', async () => {
    const { user } = renderWithUser(<SkillForm onCancel={vi.fn()} availableSkills={availableSkills} />)

    await user.type(screen.getByRole('combobox', { name: /Compétence/ }), 'écoute')
    await user.click(await screen.findByRole('option', { name: /Écoute active/ }))
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(formSubmissions.at(-1)!.data).toEqual({ name: 'Écoute active', category: '', level: 3 })
  })

  test('création d’une nouvelle compétence : affiche le champ catégorie optionnel', async () => {
    const { user } = renderWithUser(<SkillForm onCancel={vi.fn()} availableSkills={availableSkills} />)

    expect(screen.queryByPlaceholderText('Ex: Frontend, Backend, Soft skills...')).not.toBeInTheDocument()
    await user.type(screen.getByRole('combobox', { name: /Compétence/ }), 'Kubernetes')
    await user.click(await screen.findByText('Créer « Kubernetes »'))

    const category = screen.getByPlaceholderText('Ex: Frontend, Backend, Soft skills...')
    await user.type(category, 'DevOps')
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(formSubmissions.at(-1)!.data).toEqual({ name: 'Kubernetes', category: 'DevOps', level: 2 })
  })

  test('effacer la sélection vide le nom et désactive l’envoi', async () => {
    const { user } = renderWithUser(<SkillForm onCancel={vi.fn()} availableSkills={availableSkills} />)

    await user.type(screen.getByRole('combobox', { name: /Compétence/ }), 'Type')
    await user.click(await screen.findByRole('option', { name: /TypeScript/ }))
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Effacer la sélection' }))
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeDisabled()
  })

  test('affiche les erreurs serveur (nom, catégorie, niveau)', async () => {
    setInertiaOutcome({ errors: { name: 'Nom invalide', category: 'Catégorie trop longue', level: 'Niveau invalide' } })
    const onCancel = vi.fn()
    const { user } = renderWithUser(<SkillForm onCancel={onCancel} availableSkills={[]} />)

    await user.type(screen.getByRole('combobox', { name: /Compétence/ }), 'Rust')
    await user.click(await screen.findByText('Créer « Rust »'))
    await user.click(screen.getByPlaceholderText('Ex: Frontend, Backend, Soft skills...'))
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(screen.getByText('Nom invalide')).toBeInTheDocument()
    expect(screen.getByText('Catégorie trop longue')).toBeInTheDocument()
    expect(screen.getByText('Niveau invalide')).toBeInTheDocument()
    expect(onCancel).not.toHaveBeenCalled()
  })

  test('pendant l’envoi, les boutons sont désactivés et le libellé change', async () => {
    const { user } = renderWithUser(<SkillForm onCancel={vi.fn()} availableSkills={availableSkills} />)

    await user.type(screen.getByRole('combobox', { name: /Compétence/ }), 'Type')
    await user.click(await screen.findByRole('option', { name: /TypeScript/ }))
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(screen.getByRole('button', { name: 'Ajout...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled()
  })

  test('Annuler appelle onCancel', async () => {
    const onCancel = vi.fn()
    const { user } = renderWithUser(<SkillForm onCancel={onCancel} />)
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
