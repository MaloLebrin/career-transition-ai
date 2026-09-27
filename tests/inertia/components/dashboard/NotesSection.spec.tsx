import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen, within } from '@testing-library/react'

import NotesSection from '~/components/dashboard/NotesSection'
import type { Note } from '~/types/note'
import { resetInertiaMock, routerSpies, setInertiaOutcome } from '../../support/inertia_mock'
import { makeNote } from '../../support/factories'
import { renderWithUser } from '../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

const notes: Note[] = [
  makeNote({ id: 1, content: 'Note privée du conseiller', visibility: 'private' }),
  makeNote({ id: 2, content: 'Note partagée', visibility: 'shared' }),
]

describe('NotesSection', () => {
  beforeEach(() => resetInertiaMock())

  test('affiche « Aucune note » et le titre personnalisé', () => {
    renderWithUser(<NotesSection employeeId={1} title="Notes de séance" initialNotes={[]} />)
    expect(screen.getByText('Notes de séance')).toBeInTheDocument()
    expect(screen.getByText('Aucune note')).toBeInTheDocument()
  })

  test('côté accompagné : notes en lecture seule, sans badge ni bouton Ajouter', () => {
    renderWithUser(<NotesSection employeeId={1} initialNotes={notes} />)
    expect(screen.getByText('Note partagée')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ajouter' })).not.toBeInTheDocument()
    expect(screen.queryByTitle('Modifier')).not.toBeInTheDocument()
    expect(screen.queryByText('Privée')).not.toBeInTheDocument()
  })

  test('conseiller (modale) : crée une note liée à l’étape puis recharge la page', async () => {
    setInertiaOutcome('success')
    const { user } = renderWithUser(
      <NotesSection employeeId={4} context="step" supportPlanStepId={9} exerciseResultId={3} isAdvisor initialNotes={notes} />
    )

    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    expect(screen.getByRole('heading', { name: 'Nouvelle note' })).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('Écris ta note ici...'), 'Relancer sur le CV')
    await user.click(screen.getByRole('button', { name: 'Ajouter la note' }))

    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees/4/notes',
      {
        content: 'Relancer sur le CV',
        visibility: 'private',
        supportPlanStepId: 9,
        exerciseResultId: undefined,
      },
      expect.objectContaining({ preserveScroll: true })
    )
    expect(routerSpies.reload).toHaveBeenCalledWith({ preserveScroll: true })
    expect(screen.queryByRole('heading', { name: 'Nouvelle note' })).not.toBeInTheDocument()
  })

  test('conseiller (inline) : crée une note liée au résultat d’exercice', async () => {
    const { user } = renderWithUser(
      <NotesSection employeeId={4} context="exercise" exerciseResultId={21} isAdvisor useModal={false} initialNotes={[]} />
    )

    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await user.type(screen.getByPlaceholderText('Écris ta note ici...'), 'Très bon résultat')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees/4/notes',
      expect.objectContaining({ supportPlanStepId: undefined, exerciseResultId: 21 }),
      expect.anything()
    )
    // Requête en vol et aucune note : indicateur de chargement
    expect(screen.queryByText('Aucune note')).not.toBeInTheDocument()
  })

  test('conseiller (inline) : Annuler referme le formulaire d’ajout', async () => {
    const { user } = renderWithUser(<NotesSection employeeId={4} isAdvisor useModal={false} initialNotes={[]} />)
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByPlaceholderText('Écris ta note ici...')).not.toBeInTheDocument()
  })

  test('conseiller (inline) : modifie une note existante', async () => {
    setInertiaOutcome('success')
    const { user } = renderWithUser(
      <NotesSection employeeId={4} isAdvisor useModal={false} initialNotes={notes} />
    )

    await user.click(screen.getAllByTitle('Modifier')[1])
    const textarea = screen.getByPlaceholderText('Écris ta note ici...')
    expect(textarea).toHaveValue('Note partagée')
    // Le bouton « Ajouter » est masqué pendant l’édition
    expect(screen.queryByRole('button', { name: 'Ajouter' })).not.toBeInTheDocument()

    await user.clear(textarea)
    await user.type(textarea, 'Note partagée v2')
    await user.click(screen.getByRole('button', { name: 'Mettre à jour' }))

    expect(routerSpies.put).toHaveBeenCalledWith(
      '/dashboard/conseiller/notes/2',
      { content: 'Note partagée v2', visibility: 'shared' },
      expect.objectContaining({ preserveScroll: true })
    )
    expect(routerSpies.reload).toHaveBeenCalled()
    expect(screen.queryByPlaceholderText('Écris ta note ici...')).not.toBeInTheDocument()
  })

  test('conseiller (inline) : Annuler quitte l’édition', async () => {
    const { user } = renderWithUser(<NotesSection employeeId={4} isAdvisor useModal={false} initialNotes={notes} />)
    await user.click(screen.getAllByTitle('Modifier')[0])
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByPlaceholderText('Écris ta note ici...')).not.toBeInTheDocument()
  })

  test('conseiller (modale) : ouvrir puis annuler l’édition', async () => {
    const { user } = renderWithUser(<NotesSection employeeId={4} isAdvisor initialNotes={notes} />)
    await user.click(screen.getAllByTitle('Modifier')[0])
    expect(screen.getByRole('heading', { name: 'Modifier la note' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('heading', { name: 'Modifier la note' })).not.toBeInTheDocument()
  })

  test('suppression confirmée : DELETE puis retrait de la note de la liste', async () => {
    setInertiaOutcome('success')
    const { user } = renderWithUser(<NotesSection employeeId={4} isAdvisor initialNotes={notes} />)

    await user.click(screen.getAllByTitle('Supprimer')[0])
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Supprimer' }))

    expect(routerSpies.delete).toHaveBeenCalledWith(
      '/dashboard/conseiller/notes/1',
      expect.objectContaining({ preserveScroll: true })
    )
    expect(screen.queryByText('Note privée du conseiller')).not.toBeInTheDocument()
    expect(screen.getByText('Note partagée')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('suppression en échec : message d’erreur, puis Annuler réinitialise', async () => {
    setInertiaOutcome({ errors: { note: 'introuvable' } })
    const { user } = renderWithUser(<NotesSection employeeId={4} isAdvisor initialNotes={notes} />)

    await user.click(screen.getAllByTitle('Supprimer')[0])
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Supprimer' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Impossible de supprimer la note.')

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Note privée du conseiller')).toBeInTheDocument()
  })

  test('se resynchronise quand initialNotes change', () => {
    const { rerender } = renderWithUser(<NotesSection employeeId={4} initialNotes={[]} />)
    expect(screen.getByText('Aucune note')).toBeInTheDocument()
    rerender(<NotesSection employeeId={4} initialNotes={notes} />)
    expect(screen.getByText('Note partagée')).toBeInTheDocument()
  })
})
