import { describe, test, expect, vi } from 'vitest'
import { render, screen, act, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LifeCurveTool from '../../../inertia/components/exercises/LifeCurveTool'

describe('LifeCurveTool', () => {
  const onSave = vi.fn()
  const onSaveDraft = vi.fn()

  test('renders intro and allows adding a point', () => {
    render(<LifeCurveTool onSave={onSave} onSaveDraft={onSaveDraft} />)

    expect(screen.getByText(/La courbe de vie/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Tracez l'évolution de votre satisfaction professionnelle/i)
    ).toBeInTheDocument()

    const labelInput = screen.getByPlaceholderText(/Premier poste chez/i)

    act(() => {
      // @ts-expect-error jsdom typing
      labelInput.value = 'Premier poste'
      labelInput.dispatchEvent(new Event('input', { bubbles: true }))
    })

    const addButton = screen.getByRole('button', { name: /Ajouter au graphique/i })
    act(() => {
      addButton.click()
    })

    expect(onSaveDraft).toHaveBeenCalled()
  })
})

describe('LifeCurveTool — parcours complet', () => {
  async function addPoint(
    user: ReturnType<typeof userEvent.setup>,
    { year, label, satisfaction }: { year: number; label: string; satisfaction?: number }
  ) {
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: String(year) } })
    await user.type(screen.getByPlaceholderText(/Premier poste chez/i), label)
    if (satisfaction !== undefined) {
      fireEvent.change(screen.getByRole('slider'), { target: { value: String(satisfaction) } })
    }
    await user.click(screen.getByRole('button', { name: 'Ajouter au graphique' }))
  }

  test('n’ajoute pas de point sans libellé', async () => {
    const user = userEvent.setup()
    render(<LifeCurveTool onSave={vi.fn()} onSaveDraft={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Ajouter au graphique' }))
    expect(
      screen.getByText('Ajoutez au moins 2 points pour visualiser votre courbe')
    ).toBeInTheDocument()
  })

  test('ajoute, trie et supprime des points ; le bouton Suivant apparaît à partir de 2 points', async () => {
    const user = userEvent.setup()
    const onSaveDraft = vi.fn()
    render(<LifeCurveTool onSave={vi.fn()} onSaveDraft={onSaveDraft} />)

    await addPoint(user, { year: 2015, label: 'Premier poste', satisfaction: 8 })
    // L'année proposée s'incrémente et la satisfaction revient à 5
    expect(screen.getByRole('spinbutton')).toHaveValue(2016)
    expect(screen.getByText('5/10')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Suivant/ })).not.toBeInTheDocument()

    await addPoint(user, { year: 2010, label: 'Stage' })
    const years = screen.getAllByText(/^(2010|2015)$/).map((el) => el.textContent)
    expect(years).toEqual(['2010', '2015'])
    expect(screen.getByRole('button', { name: /Suivant : Analyse/ })).toBeInTheDocument()

    expect(onSaveDraft).toHaveBeenLastCalledWith(
      expect.objectContaining({
        step: 1,
        points: [
          { year: 2010, satisfaction: 5, label: 'Stage' },
          { year: 2015, satisfaction: 8, label: 'Premier poste' },
        ],
      })
    )

    // Suppression du premier point (Stage)
    const stageRow = screen.getByText('Stage').closest('div')!.parentElement!
    await user.click(within(stageRow).getByRole('button'))
    expect(screen.queryByText('Stage')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Suivant/ })).not.toBeInTheDocument()
  })

  test('étape 2 : réflexion puis finalisation avec les points triés et la durée', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<LifeCurveTool onSave={onSave} onSaveDraft={vi.fn()} />)

    await addPoint(user, { year: 2018, label: 'Reconversion' })
    await addPoint(user, { year: 2012, label: 'Début' })
    await user.click(screen.getByRole('button', { name: /Suivant : Analyse/ }))

    expect(screen.getByText('Exploitons vos réponses')).toBeInTheDocument()
    const answers = screen.getAllByRole('textbox')
    expect(answers).toHaveLength(6)
    const texts = ['En U', 'Plutôt oui', 'Moyenne', 'Changements de poste', 'Non', 'Oui']
    for (const [i, text] of texts.entries()) {
      await user.type(answers[i], text)
    }

    // Retour à l'étape 1 puis retour à l'analyse : les réponses sont conservées
    await user.click(screen.getByRole('button', { name: 'Retour' }))
    expect(screen.getByText('La courbe de vie')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Suivant : Analyse/ }))
    expect(screen.getAllByRole('textbox')[0]).toHaveValue('En U')

    await user.click(screen.getByRole('button', { name: "Finaliser l'analyse" }))
    expect(onSave).toHaveBeenCalledWith(
      {
        points: [
          { year: 2012, satisfaction: 5, label: 'Début' },
          { year: 2018, satisfaction: 5, label: 'Reconversion' },
        ],
        reflection: {
          form: 'En U',
          mostlySatisfied: 'Plutôt oui',
          amplitude: 'Moyenne',
          explanation: 'Changements de poste',
          surprise: 'Non',
          coherence: 'Oui',
        },
      },
      expect.any(Number)
    )
  })

  test('restaure un brouillon (points, réflexion, étape) sans l’écraser à vide', async () => {
    const onSaveDraft = vi.fn()
    const draft = {
      data: {
        points: [
          { year: 2000, satisfaction: 3, label: 'Usine' },
          { year: 2005, satisfaction: 9, label: 'Promotion' },
        ],
        reflection: {
          form: 'Montante',
          mostlySatisfied: '',
          amplitude: '',
          explanation: '',
          surprise: '',
          coherence: '',
        },
        step: 2,
      },
    }
    render(
      <LifeCurveTool
        onSave={vi.fn()}
        onSaveDraft={onSaveDraft}
        initialDraftPromise={Promise.resolve(draft as never)}
      />
    )

    expect(await screen.findByText('Exploitons vos réponses')).toBeInTheDocument()
    expect(screen.getAllByRole('textbox')[0]).toHaveValue('Montante')
    // Pas d'autosave en étape 2
    expect(onSaveDraft).not.toHaveBeenCalled()
  })

  test('affiche la courbe dès qu’il y a au moins deux points', async () => {
    const user = userEvent.setup()
    const originalRect = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = function () {
      if (this.classList?.contains('recharts-responsive-container')) {
        return {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: 800,
          bottom: 400,
          width: 800,
          height: 400,
          toJSON() {},
        }
      }
      return originalRect.call(this)
    }
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )

    try {
      render(<LifeCurveTool onSave={vi.fn()} onSaveDraft={vi.fn()} />)
      const chart = screen.getByTestId('life-curve-chart')
      expect(chart.className).not.toMatch(/\bflex\b/)

      await addPoint(user, { year: 2010, label: 'Stage', satisfaction: 4 })
      expect(
        screen.getByText('Ajoutez au moins 2 points pour visualiser votre courbe')
      ).toBeInTheDocument()

      await addPoint(user, { year: 2014, label: 'Premier poste', satisfaction: 8 })
      await addPoint(user, { year: 2019, label: 'Reconversion', satisfaction: 6 })

      await waitFor(() => {
        const curve = chart.querySelector('.recharts-line-curve')
        expect(curve).toBeTruthy()
        expect(curve?.getAttribute('d')).toBeTruthy()
      })
      expect(chart.querySelectorAll('.recharts-line-dot').length).toBeGreaterThanOrEqual(3)
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalRect
      vi.unstubAllGlobals()
    }
  })

  test('un brouillon arrivé après la saisie ne remplace pas les points', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <LifeCurveTool
        onSave={vi.fn()}
        onSaveDraft={vi.fn()}
        initialDraftPromise={Promise.resolve(null)}
      />
    )

    await addPoint(user, { year: 2010, label: 'Stage' })
    await addPoint(user, { year: 2015, label: 'Premier poste' })
    expect(screen.getByRole('button', { name: /Suivant : Analyse/ })).toBeInTheDocument()

    rerender(
      <LifeCurveTool
        onSave={vi.fn()}
        onSaveDraft={vi.fn()}
        initialDraftPromise={Promise.resolve({ data: { points: [], step: 1 } } as never)}
      />
    )

    expect(screen.getByText('Stage')).toBeInTheDocument()
    expect(screen.getByText('Premier poste')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Suivant : Analyse/ })).toBeInTheDocument()
  })

  test('brouillon vide : reste en étape 1 avec les valeurs par défaut', async () => {
    const onSaveDraft = vi.fn()
    render(
      <LifeCurveTool
        onSave={vi.fn()}
        onSaveDraft={onSaveDraft}
        initialDraftPromise={Promise.resolve({ data: {} } as never)}
      />
    )
    await waitFor(() =>
      expect(onSaveDraft).toHaveBeenCalledWith(expect.objectContaining({ points: [], step: 1 }))
    )
    expect(screen.getByText('La courbe de vie')).toBeInTheDocument()
  })
})
