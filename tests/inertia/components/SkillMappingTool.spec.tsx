import { describe, test, expect, vi } from 'vitest'
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react'
import SkillMappingTool from '../../../inertia/components/exercises/SkillMappingTool'

vi.mock('../../../inertia/helpers/ai', () => ({
  extractSkillMappingFromText: vi.fn(async () => ({
    mapping: [
      { mission: 'Mission A', activity: 'Activité A', proof: 'Preuve A' },
    ],
  })),
}))

describe('SkillMappingTool', () => {
  test('renders intro, processes narrative with AI and saves draft', async () => {
    const onSave = vi.fn()
    const onSaveDraft = vi.fn()

    const experiences = [
      { id: 'exp-1', title: 'Développeur', company: 'ACME', startDate: '', endDate: '', isCurrent: false },
    ] as any

    render(
      <SkillMappingTool
        onSave={onSave}
        onSaveDraft={onSaveDraft}
        experiences={experiences}
      />
    )

    expect(screen.getByText(/Racontez votre parcours/i)).toBeInTheDocument()

    const textarea = screen.getByPlaceholderText(
      /Dans mon dernier poste/i
    ) as HTMLTextAreaElement

    await act(async () => {
      fireEvent.change(textarea, {
        target: {
          value: "Dans mon dernier poste, j'étais responsable de...",
        },
      })
    })

    // Le bouton doit être activé dès qu'il y a un texte suffisamment long
    const processButton = screen.getByRole('button', {
      name: /Restructurer mon récit/i,
    })

    await act(async () => {
      processButton.click()
    })

    // Attendre que la deuxième étape (tableau) apparaisse
    await waitFor(() => {
      expect(
        screen.getByText(/Validation des Acquis/i)
      ).toBeInTheDocument()
    })

    // Le draft doit avoir été sauvegardé au moins une fois (useEffect)
    expect(onSaveDraft).toHaveBeenCalled()
    expect(onSave).not.toHaveBeenCalled()
  })

  test('allows adding a manual row and saving the mapping', async () => {
    const onSave = vi.fn()
    const onSaveDraft = vi.fn()

    const experiences = [
      { id: 'exp-1', title: 'Consultant', company: 'ACME', startDate: '', endDate: '', isCurrent: false },
    ] as any

    render(
      <SkillMappingTool
        onSave={onSave}
        onSaveDraft={onSaveDraft}
        experiences={experiences}
      />
    )

    // Passer à l'étape 2 en remplissant le récit puis en cliquant sur le bouton
    const textarea = screen.getByPlaceholderText(
      /Dans mon dernier poste/i
    ) as HTMLTextAreaElement

    await act(async () => {
      fireEvent.change(textarea, {
        target: {
          value: "Dans mon dernier poste, j'étais responsable de...",
        },
      })
    })

    const processButton = screen.getByRole('button', {
      name: /Restructurer mon récit/i,
    })

    await act(async () => {
      processButton.click()
    })

    await waitFor(() => {
      expect(screen.getByText(/Validation des Acquis/i)).toBeInTheDocument()
    })

    // Puis ajouter une ligne manuelle sur l'étape 2
    const addRowButton = screen.getByRole('button', {
      name: /Ajouter une ligne/i,
    })

    await act(async () => {
      addRowButton.click()
    })

    const missionInputs = screen.getAllByPlaceholderText('Mission...')
    await act(async () => {
      const input = missionInputs[0] as HTMLTextAreaElement
      fireEvent.change(input, { target: { value: 'Nouvelle mission' } })
    })

    const saveButton = screen.getByRole('button', {
      name: /Valider & Transmettre/i,
    })

    await act(async () => {
      saveButton.click()
    })

    expect(onSave).toHaveBeenCalled()
    const [payload, duration] = onSave.mock.calls[0]
    expect(payload.mapping.length).toBeGreaterThan(0)
    expect(duration).toBeGreaterThanOrEqual(0)
  })
})

