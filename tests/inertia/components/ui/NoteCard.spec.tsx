import { describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import NoteCard from '~/components/ui/NoteCard'
import { makeNote } from '../../support/factories'
import { renderWithUser } from '../../support/render'

describe('NoteCard', () => {
  test('affiche le contenu, l’auteur et son initiale en majuscule', () => {
    renderWithUser(<NoteCard note={makeNote()} />)
    expect(screen.getByText('Premier échange très positif')).toBeInTheDocument()
    expect(screen.getByText('claire dupont')).toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
  })

  test('badge « Privée » pour une note privée', () => {
    renderWithUser(<NoteCard note={makeNote({ visibility: 'private' })} />)
    expect(screen.getByText('Privée')).toBeInTheDocument()
    expect(screen.queryByText('Partagée')).not.toBeInTheDocument()
  })

  test('badge « Partagée » pour une note partagée', () => {
    renderWithUser(<NoteCard note={makeNote({ visibility: 'shared' })} />)
    expect(screen.getByText('Partagée')).toBeInTheDocument()
  })

  test('masque le badge de visibilité si demandé', () => {
    renderWithUser(<NoteCard note={makeNote()} showVisibilityBadge={false} />)
    expect(screen.queryByText('Privée')).not.toBeInTheDocument()
  })

  test('mentionne la date de modification uniquement si la note a été modifiée', () => {
    const { unmount } = renderWithUser(<NoteCard note={makeNote()} />)
    expect(screen.queryByText(/Modifié le/)).not.toBeInTheDocument()
    unmount()

    renderWithUser(<NoteCard note={makeNote({ updatedAt: '2024-04-02T15:30:00.000Z' })} />)
    expect(screen.getByText(/Modifié le/)).toBeInTheDocument()
  })

  test('les boutons Modifier / Supprimer transmettent la note', async () => {
    const note = makeNote({ id: 8 })
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const { user } = renderWithUser(<NoteCard note={note} onEdit={onEdit} onDelete={onDelete} />)

    await user.click(screen.getByTitle('Modifier'))
    await user.click(screen.getByTitle('Supprimer'))
    expect(onEdit).toHaveBeenCalledWith(note)
    expect(onDelete).toHaveBeenCalledWith(note)
  })

  test('une note partagée n’affiche que les actions fournies', () => {
    renderWithUser(<NoteCard note={makeNote({ visibility: 'shared' })} onEdit={vi.fn()} />)
    expect(screen.getByTitle('Modifier')).toBeInTheDocument()
    expect(screen.queryByTitle('Supprimer')).not.toBeInTheDocument()
  })

  test('aucune action quand la note n’est pas modifiable ou sans callback', () => {
    const { unmount } = renderWithUser(
      <NoteCard note={makeNote({ canEdit: false })} onEdit={vi.fn()} onDelete={vi.fn()} />
    )
    expect(screen.queryByTitle('Modifier')).not.toBeInTheDocument()
    unmount()

    renderWithUser(<NoteCard note={makeNote()} />)
    expect(screen.queryByTitle('Supprimer')).not.toBeInTheDocument()
  })
})
