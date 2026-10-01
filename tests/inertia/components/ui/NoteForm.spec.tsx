import { describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import NoteForm from '~/components/ui/NoteForm'
import { renderWithUser } from '../../support/render'

describe('NoteForm', () => {
  test('désactive l’envoi tant que le contenu est vide ou blanc', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithUser(<NoteForm onSubmit={onSubmit} onCancel={vi.fn()} />)

    const submit = screen.getByRole('button', { name: 'Enregistrer' })
    expect(submit).toBeDisabled()
    await user.type(screen.getByPlaceholderText('Écris ta note ici...'), '   ')
    expect(submit).toBeDisabled()
  })

  test('envoie le contenu nettoyé avec la visibilité privée par défaut', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithUser(
      <NoteForm onSubmit={onSubmit} onCancel={vi.fn()} submitLabel="Ajouter" />
    )

    expect(screen.queryByText(/sera visible par l'accompagné/)).not.toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('Écris ta note ici...'), '  Bilan à relancer  ')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(onSubmit).toHaveBeenCalledWith({ content: 'Bilan à relancer', visibility: 'private' })
  })

  test('passer en « Partagée » affiche l’avertissement et change la visibilité envoyée', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithUser(<NoteForm onSubmit={onSubmit} onCancel={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Partagée/ }))
    expect(screen.getByText(/sera visible par l'accompagné/)).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Écris ta note ici...'), 'Bravo !')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(onSubmit).toHaveBeenCalledWith({ content: 'Bravo !', visibility: 'shared' })
  })

  test('pré-remplit le contenu et la visibilité, et peut revenir en privé', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithUser(
      <NoteForm
        initialContent="Texte initial"
        initialVisibility="shared"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByPlaceholderText('Écris ta note ici...')).toHaveValue('Texte initial')
    await user.click(screen.getByRole('button', { name: /Privée/ }))
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(onSubmit).toHaveBeenCalledWith({ content: 'Texte initial', visibility: 'private' })
  })

  test('en chargement : champs désactivés et libellé « Enregistrement... »', () => {
    renderWithUser(<NoteForm initialContent="x" isLoading onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Enregistrement...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled()
    expect(screen.getByPlaceholderText('Écris ta note ici...')).toBeDisabled()
    expect(screen.getByRole('button', { name: /Partagée/ })).toBeDisabled()
  })

  test('Annuler appelle onCancel', async () => {
    const onCancel = vi.fn()
    const { user } = renderWithUser(<NoteForm onSubmit={vi.fn()} onCancel={onCancel} />)
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
