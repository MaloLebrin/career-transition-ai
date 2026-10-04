import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'

import ProfilePage from '~/components/profile/ProfilePage'
import { extractCVData } from '~/helpers/ai'
import type { Employee } from '~/types/employee'
import { renderWithUser } from '../../support/render'

vi.mock('~/helpers/ai', () => ({
  extractCVData: vi.fn(),
}))

function makeProfile(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 1,
    organizationId: 2,
    name: 'Camille Martin',
    email: 'camille@example.com',
    currentRole: 'Comptable',
    targetRole: 'Data analyst',
    summary: 'Passionnée de chiffres',
    skills: [{ name: 'Excel', level: 4 }],
    experiences: [
      {
        id: 11,
        title: 'Comptable',
        company: 'Fiducial',
        type: 'CDI',
        startDate: '2018-01-01',
        endDate: '2023-01-01',
        isCurrent: false,
        description: 'Clôtures mensuelles',
      },
    ],
    educations: [
      {
        id: 21,
        degree: 'DCG',
        school: 'INTEC',
        startDate: '2014-09-01',
        endDate: '2017-06-01',
        isCurrent: false,
        description: '',
      },
    ],
    status: 'active',
    onboarded: true,
    exercises: [],
    plan: [],
    ...overrides,
  } as Employee
}

function renderPage(employee = makeProfile()) {
  const onSave = vi.fn()
  const onBack = vi.fn()
  const utils = renderWithUser(<ProfilePage employee={employee} onSave={onSave} onBack={onBack} />)
  return { ...utils, onSave, onBack }
}

const lastSaved = (onSave: ReturnType<typeof vi.fn>) => onSave.mock.calls.at(-1)![0] as Employee

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.mocked(extractCVData).mockReset()
    vi.mocked(alert).mockClear()
  })

  test('onglet Infos : édition du nom, des postes et du résumé puis sauvegarde', async () => {
    const { user, onSave } = renderPage()

    expect(screen.getByRole('heading', { name: 'Mon Profil Carrière' })).toBeInTheDocument()
    const name = screen.getByRole('textbox', { name: 'Nom complet' })
    expect(name).toHaveValue('Camille Martin')

    await user.clear(name)
    await user.type(name, 'Zoé Martin')
    expect(screen.getByText('Z')).toBeInTheDocument()

    await user.clear(screen.getByRole('textbox', { name: 'Poste actuel' }))
    await user.type(screen.getByRole('textbox', { name: 'Poste actuel' }), 'Aide-comptable')
    await user.clear(screen.getByRole('textbox', { name: 'Cible professionnelle' }))
    await user.type(screen.getByRole('textbox', { name: 'Cible professionnelle' }), 'BI analyst')
    const summary = screen.getByPlaceholderText(/Décrivez votre parcours/)
    await user.clear(summary)
    await user.type(summary, 'Nouveau résumé')

    await user.click(screen.getByRole('button', { name: 'Sauvegarder' }))
    expect(lastSaved(onSave)).toMatchObject({
      id: 1,
      status: 'active',
      name: 'Zoé Martin',
      currentRole: 'Aide-comptable',
      targetRole: 'BI analyst',
      summary: 'Nouveau résumé',
    })
  })

  test('valeurs par défaut quand le profil est incomplet', async () => {
    const { user, onSave } = renderPage(
      makeProfile({
        currentRole: undefined as never,
        targetRole: undefined,
        summary: undefined,
        skills: undefined as never,
        experiences: undefined as never,
        educations: undefined as never,
      })
    )
    await user.click(screen.getByRole('button', { name: 'Sauvegarder' }))
    expect(lastSaved(onSave)).toMatchObject({
      currentRole: '',
      targetRole: '',
      summary: '',
      skills: [],
      experiences: [],
      educations: [],
    })
  })

  test('le bouton retour appelle onBack', async () => {
    const { user, onBack } = renderPage()
    await user.click(screen.getAllByRole('button')[0])
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  test('onglet Expériences : modifier, ajouter et supprimer une expérience', async () => {
    const { user, onSave } = renderPage()
    await user.click(screen.getByRole('button', { name: 'Expériences & Études' }))

    expect(screen.getByRole('heading', { name: 'Parcours Pro' })).toBeInTheDocument()
    const title = screen.getByRole('textbox', { name: 'Intitulé' })
    await user.clear(title)
    await user.type(title, 'Chef comptable')
    await user.type(screen.getByRole('textbox', { name: 'Entreprise' }), ' SA')
    await user.selectOptions(screen.getByRole('combobox'), 'Freelance')
    await user.type(screen.getByPlaceholderText('Description des missions...'), ' et audit')
    await user.click(screen.getByLabelText('Poste actuel'))

    await user.click(screen.getByRole('button', { name: 'Sauvegarder' }))
    expect(lastSaved(onSave).experiences[0]).toMatchObject({
      id: 11,
      title: 'Chef comptable',
      company: 'Fiducial SA',
      type: 'Freelance',
      isCurrent: true,
      description: 'Clôtures mensuelles et audit',
    })

    // Ajout : la nouvelle expérience vide arrive en tête
    const [addExperience] = within(
      screen.getByRole('heading', { name: 'Parcours Pro' }).parentElement!
    ).getAllByRole('button')
    await user.click(addExperience)
    expect(screen.getAllByRole('textbox', { name: 'Intitulé' })).toHaveLength(2)
    expect(screen.getAllByRole('textbox', { name: 'Intitulé' })[0]).toHaveValue('')

    // Suppression de l'expérience d'origine
    const originalCard = screen.getByDisplayValue('Chef comptable').closest('.group') as HTMLElement
    await user.click(within(originalCard).getAllByRole('button')[0])
    await user.click(screen.getByRole('button', { name: 'Sauvegarder' }))
    expect(lastSaved(onSave).experiences).toHaveLength(1)
    expect(lastSaved(onSave).experiences[0]).toMatchObject({ title: '', type: 'CDI' })
  })

  test('onglet Expériences : modifier, ajouter et supprimer une formation', async () => {
    const { user, onSave } = renderPage()
    await user.click(screen.getByRole('button', { name: 'Expériences & Études' }))

    const degree = screen.getByRole('textbox', { name: 'Diplôme' })
    await user.clear(degree)
    await user.type(degree, 'DSCG')
    await user.type(screen.getByRole('textbox', { name: 'École' }), ' Paris')
    await user.click(screen.getByLabelText('Formation en cours'))
    // Formation en cours : plus de date de fin (une seule restante, pour l'expérience)
    expect(screen.getAllByRole('textbox', { name: 'Fin' })).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Sauvegarder' }))
    expect(lastSaved(onSave).educations[0]).toMatchObject({
      id: 21,
      degree: 'DSCG',
      school: 'INTEC Paris',
      isCurrent: true,
    })

    const [addEducation] = within(
      screen.getByRole('heading', { name: 'Éducation' }).parentElement!
    ).getAllByRole('button')
    await user.click(addEducation)
    expect(screen.getAllByRole('textbox', { name: 'Diplôme' })).toHaveLength(2)

    const originalCard = screen.getByDisplayValue('DSCG').closest('.group') as HTMLElement
    await user.click(within(originalCard).getAllByRole('button')[0])
    await user.click(screen.getByRole('button', { name: 'Sauvegarder' }))
    expect(lastSaved(onSave).educations).toEqual([
      expect.objectContaining({ degree: '', school: '', isCurrent: false }),
    ])
  })

  test('onglet Compétences : niveau, suppression et état vide', async () => {
    const { user, onSave } = renderPage()
    await user.click(screen.getByRole('button', { name: 'Compétences' }))

    expect(screen.getByText('Excel')).toBeInTheDocument()
    expect(screen.getByText('Avancé')).toBeInTheDocument()

    const card = screen.getByText('Excel').closest('.group') as HTMLElement
    const [removeButton, ...levelButtons] = within(card).getAllByRole('button')
    await user.click(levelButtons[4])
    expect(within(card).getByText('Expert')).toBeInTheDocument()
    await user.click(levelButtons[0])
    expect(within(card).getByText('Débutant')).toBeInTheDocument()
    await user.click(levelButtons[1])
    expect(within(card).getByText('Intermédiaire')).toBeInTheDocument()
    await user.click(levelButtons[2])
    expect(within(card).getByText('Confirmé')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sauvegarder' }))
    expect(lastSaved(onSave).skills).toEqual([{ name: 'Excel', level: 3 }])

    await user.click(removeButton)
    expect(screen.getByText('Identifiez vos forces professionnelles')).toBeInTheDocument()
  })

  test('modale d’ajout de compétence : niveaux, doublon refusé, ajout et fermeture', async () => {
    const { user, onSave } = renderPage()
    await user.click(screen.getByRole('button', { name: 'Compétences' }))
    await user.click(screen.getByRole('button', { name: '+ Ajouter une compétence' }))

    const modal = screen.getByRole('heading', { name: 'Ajouter une Compétence' })
      .parentElement as HTMLElement
    const submit = within(modal).getByRole('button', { name: 'Ajouter au profil' })
    expect(submit).toBeDisabled()
    expect(within(modal).getByText('Niveau Confirmé')).toBeInTheDocument()

    const levels: Array<[string, string]> = [
      ['1', 'Niveau Débutant'],
      ['2', 'Niveau Intermédiaire'],
      ['4', 'Niveau Avancé'],
      ['5', 'Niveau Expert'],
    ]
    for (const [lvl, label] of levels) {
      await user.click(within(modal).getByRole('button', { name: lvl }))
      expect(within(modal).getByText(label)).toBeInTheDocument()
    }

    // Doublon (insensible à la casse)
    const nameInput = within(modal).getByRole('textbox', { name: 'Nom de la compétence' })
    await user.type(nameInput, 'excel')
    await user.click(submit)
    expect(alert).toHaveBeenCalledWith('Cette compétence existe déjà.')

    await user.clear(nameInput)
    await user.type(nameInput, 'Power BI')
    await user.click(submit)
    expect(
      screen.queryByRole('heading', { name: 'Ajouter une Compétence' })
    ).not.toBeInTheDocument()
    expect(screen.getByText('Power BI')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sauvegarder' }))
    expect(lastSaved(onSave).skills).toEqual([
      { name: 'Excel', level: 4 },
      { name: 'Power BI', level: 5 },
    ])

    // Réouverture puis fermeture par la croix
    await user.click(screen.getByRole('button', { name: '+ Ajouter une compétence' }))
    const reopened = screen.getByRole('heading', { name: 'Ajouter une Compétence' })
      .parentElement as HTMLElement
    expect(within(reopened).getByRole('textbox', { name: 'Nom de la compétence' })).toHaveValue('')
    await user.click(within(reopened).getAllByRole('button')[0])
    expect(
      screen.queryByRole('heading', { name: 'Ajouter une Compétence' })
    ).not.toBeInTheDocument()
  })

  test('import de CV : fusionne les données extraites avec le profil', async () => {
    vi.mocked(extractCVData).mockResolvedValue({
      name: 'Camille M.',
      currentRole: '',
      suggestedTargetRole: 'Data engineer',
      skills: [{ name: 'SQL', level: 3 }],
      summary: null,
      experiences: null,
      educations: null,
    } as never)
    const { user, container, onSave } = renderPage()

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' }))

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Nom complet' })).toHaveValue('Camille M.')
    )
    expect(extractCVData).toHaveBeenCalledWith(expect.any(File))
    expect(screen.getByText('Mettre à jour par CV')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sauvegarder' }))
    expect(lastSaved(onSave)).toMatchObject({
      name: 'Camille M.',
      currentRole: 'Comptable',
      targetRole: 'Data engineer',
      summary: 'Passionnée de chiffres',
      skills: [{ name: 'SQL', level: 3 }],
    })
    expect(lastSaved(onSave).experiences).toHaveLength(1)
  })

  test('import de CV : aucune donnée extraite laisse le profil inchangé', async () => {
    vi.mocked(extractCVData).mockResolvedValue(null)
    const { container } = renderPage()

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, {
      target: { files: [new File(['x'], 'cv.png', { type: 'image/png' })] },
    })
    await waitFor(() => expect(extractCVData).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText('Mettre à jour par CV')).toBeInTheDocument())
    expect(screen.getByRole('textbox', { name: 'Nom complet' })).toHaveValue('Camille Martin')

    // Sélection annulée : rien ne se passe
    fireEvent.change(fileInput, { target: { files: [] } })
    expect(extractCVData).toHaveBeenCalledTimes(1)
  })
})
