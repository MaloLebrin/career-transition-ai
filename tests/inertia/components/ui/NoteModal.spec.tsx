import { describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import NoteModal from '~/components/ui/NoteModal'
import { makeNote } from '../../support/factories'
import { renderWithUser } from '../../support/render'

describe('NoteModal', () => {
  test('ne rend rien quand elle est fermée', () => {
    renderWithUser(<NoteModal isOpen={false} onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.queryByText('Nouvelle note')).not.toBeInTheDocument()
  })

  test('création : titre « Nouvelle note » et envoi du contenu nettoyé en privé', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithUser(<NoteModal isOpen onSubmit={onSubmit} onCancel={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Nouvelle note' })).toBeInTheDocument()
    const submit = screen.getByRole('button', { name: 'Ajouter la note' })
    expect(submit).toBeDisabled()

    await user.type(screen.getByPlaceholderText('Écris ta note ici...'), '  Point d’étape  ')
    await user.click(submit)
    expect(onSubmit).toHaveBeenCalledWith({ content: 'Point d’étape', visibility: 'private' })
  })

  test('passer en partagée affiche l’avertissement et envoie visibility=shared', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithUser(<NoteModal isOpen onSubmit={onSubmit} onCancel={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Partagée/ }))
    expect(screen.getByText('Attention : note partagée')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Privée/ }))
    expect(screen.queryByText('Attention : note partagée')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Partagée/ }))
    await user.type(screen.getByPlaceholderText('Écris ta note ici...'), 'À lire')
    await user.click(screen.getByRole('button', { name: 'Ajouter la note' }))
    expect(onSubmit).toHaveBeenCalledWith({ content: 'À lire', visibility: 'shared' })
  })

  test('édition : pré-remplit la note et propose « Mettre à jour »', async () => {
    const onSubmit = vi.fn()
    const note = makeNote({ content: 'Ancien texte', visibility: 'shared' })
    const { user } = renderWithUser(
      <NoteModal isOpen note={note} onSubmit={onSubmit} onCancel={vi.fn()} />
    )

    expect(screen.getByRole('heading', { name: 'Modifier la note' })).toBeInTheDocument()
    const textarea = screen.getByPlaceholderText('Écris ta note ici...')
    expect(textarea).toHaveValue('Ancien texte')
    expect(screen.getByText('Attention : note partagée')).toBeInTheDocument()

    await user.clear(textarea)
    await user.type(textarea, 'Nouveau texte')
    await user.click(screen.getByRole('button', { name: 'Mettre à jour' }))
    expect(onSubmit).toHaveBeenCalledWith({ content: 'Nouveau texte', visibility: 'shared' })
  })

  test('ferme via Annuler, la croix ou le fond, mais pas en cliquant dans la carte', async () => {
    const onCancel = vi.fn()
    const { user, container } = renderWithUser(
      <NoteModal isOpen onSubmit={vi.fn()} onCancel={onCancel} />
    )

    await user.click(screen.getByRole('heading', { name: 'Nouvelle note' }))
    expect(onCancel).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    const [closeButton] = screen.getAllByRole('button')
    await user.click(closeButton)
    await user.click(container.firstElementChild as HTMLElement)
    expect(onCancel).toHaveBeenCalledTimes(3)
  })

  test('en chargement : impossible de fermer, tout est désactivé', async () => {
    const onCancel = vi.fn()
    const { user, container } = renderWithUser(
      <NoteModal isOpen isLoading note={makeNote()} onSubmit={vi.fn()} onCancel={onCancel} />
    )

    expect(screen.getByRole('button', { name: 'Enregistrement...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled()
    expect(screen.getByPlaceholderText('Écris ta note ici...')).toBeDisabled()

    await user.click(container.firstElementChild as HTMLElement)
    expect(onCancel).not.toHaveBeenCalled()
  })
})
