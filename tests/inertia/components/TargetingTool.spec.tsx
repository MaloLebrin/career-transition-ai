import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TargetingTool from '../../../inertia/components/exercises/TargetingTool'
import { suggestTargets } from '../../../inertia/helpers/ai'

vi.mock('../../../inertia/helpers/ai', () => ({
  suggestTargets: vi.fn().mockResolvedValue({
    companies: ['AFPA', "L'Oréal"],
    sectors: ['Formation professionnelle'],
  }),
}))

describe('TargetingTool', () => {
  const onSave = vi.fn()

  beforeEach(() => {
    onSave.mockReset()
  })

  test('renders intro and add-manual button', () => {
    render(<TargetingTool onSave={onSave} />)

    expect(screen.getByText(/Ciblage & Plan d'Action/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Identifiez les structures qui correspondent à votre projet professionnel/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ajouter manuellement/i })).toBeInTheDocument()
  })

  test('allows adding a manual target and saving it', () => {
    render(<TargetingTool onSave={onSave} />)

    const addButton = screen.getByRole('button', { name: /Ajouter manuellement/i })
    act(() => {
      addButton.click()
    })

    const nameInput = screen.getByPlaceholderText(
      /AFPA, L'Oréal, Startup X/i
    ) as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'AFPA' } })

    const saveButton = screen.getByRole('button', { name: /Valider mon ciblage expert/i })
    act(() => {
      saveButton.click()
    })

    expect(onSave).toHaveBeenCalledTimes(1)
    const [payload] = onSave.mock.calls[0]
    expect(payload.targets).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'AFPA' })])
    )
  })
})

describe('TargetingTool — parcours complet', () => {
  const profile = { skills: ['Pédagogie'], targetRole: 'Formateur' }

  beforeEach(() => {
    vi.mocked(alert).mockClear()
  })

  test('sans profil, le bouton IA n’est pas proposé', () => {
    render(<TargetingTool onSave={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /brainstormer/ })).not.toBeInTheDocument()
    expect(screen.getByText(/Utilisez le bouton IA ou ajoutez manuellement/)).toBeInTheDocument()
  })

  test('les suggestions IA s’affichent et un clic ajoute l’entreprise en cible', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<TargetingTool onSave={onSave} employeeProfile={profile} />)

    await user.click(screen.getByRole('button', { name: /Faire brainstormer l'IA/ }))
    expect(suggestTargets).toHaveBeenCalledWith(profile)
    expect(await screen.findByText("Suggestions de l'IA")).toBeInTheDocument()
    expect(screen.getByText('Secteur: Formation professionnelle')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '+ AFPA' }))
    expect(screen.getByText('Ma liste de cibles (1)')).toBeInTheDocument()
    expect(screen.getByDisplayValue('AFPA')).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox'), 'Organisme de formation')
    await user.type(screen.getByPlaceholderText(/Pourquoi ciblez-vous/), 'Proche de chez moi')
    await user.click(screen.getByRole('button', { name: /Valider mon ciblage expert/ }))

    expect(onSave).toHaveBeenCalledWith(
      {
        targets: [
          expect.objectContaining({
            name: 'AFPA',
            type: 'Organisme de formation',
            comment: 'Proche de chez moi',
          }),
        ],
      },
      expect.any(Number)
    )
  })

  test('une erreur de l’IA est journalisée sans afficher de suggestions', async () => {
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(suggestTargets).mockRejectedValueOnce(new Error('quota'))
    render(<TargetingTool onSave={vi.fn()} employeeProfile={profile} />)

    await user.click(screen.getByRole('button', { name: /Faire brainstormer l'IA/ }))
    expect(consoleError).toHaveBeenCalled()
    expect(screen.queryByText("Suggestions de l'IA")).not.toBeInTheDocument()
    consoleError.mockRestore()
  })

  test('refuse d’enregistrer sans cible nommée et ignore les cibles vides', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<TargetingTool onSave={onSave} />)

    await user.click(screen.getByRole('button', { name: /Valider mon ciblage expert/ }))
    expect(alert).toHaveBeenCalledWith('Veuillez ajouter au moins une cible avec un nom.')
    expect(onSave).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /Ajouter manuellement/ }))
    await user.click(screen.getByRole('button', { name: /Ajouter manuellement/ }))
    const [newest] = screen.getAllByPlaceholderText(/AFPA, L'Oréal/)
    await user.type(newest, 'Pôle emploi')
    await user.click(screen.getByRole('button', { name: /Valider mon ciblage expert/ }))

    expect(onSave.mock.calls[0][0].targets).toEqual([
      expect.objectContaining({ name: 'Pôle emploi', type: 'Entreprise' }),
    ])
  })

  test('la corbeille supprime une cible', async () => {
    const user = userEvent.setup()
    render(<TargetingTool onSave={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Ajouter manuellement/ }))

    const card = screen.getByPlaceholderText(/AFPA, L'Oréal/).closest('div.group') as HTMLElement
    const [trash] = within(card).getAllByRole('button')
    await user.click(trash)
    expect(screen.getByText('Ma liste de cibles (0)')).toBeInTheDocument()
  })
})
