import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'

import DashboardEmployeeDetail from '~/pages/dashboard/conseiller/employees/Detail'
import type { Employee } from '~/types/employee'
import { resetInertiaMock, routerSpies, setInertiaOutcome } from '../../../../support/inertia_mock'
import { makeNote } from '../../../../support/factories'
import { renderWithUser } from '../../../../support/render'

const pdf = vi.hoisted(() => ({ generateComprehensivePDF: vi.fn() }))

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})
vi.mock('~/services/pdf_service', () => pdf)
vi.mock('~/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('~/components/modals/StepEditorModal', () => ({
  StepEditorModal: (props: {
    step?: { id: number }
    stepNumber?: number
    completedExercises: string[]
    onClose: () => void
  }) => (
    <div role="dialog" aria-label="Éditeur d'étape">
      <span>{props.step ? `Édition étape ${props.step.id}` : `Nouvelle étape n°${props.stepNumber}`}</span>
      <span>Exercices faits : {props.completedExercises.join(',')}</span>
      <button type="button" onClick={props.onClose}>
        Fermer l’éditeur
      </button>
    </div>
  ),
}))

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 5,
    organizationId: 1,
    name: 'Camille Martin',
    email: 'camille@example.com',
    currentRole: 'Comptable',
    targetRole: 'Data analyst',
    advisorNotes: 'Suivi hebdo',
    skills: [{ name: 'Excel', level: 4 }],
    experiences: [],
    educations: [],
    status: 'active',
    onboarded: true,
    exercises: [
      { id: 1, type: 'VALUES', date: '2024-02-01', data: {} },
      { id: 2, type: 'values', date: '2024-03-15', data: {} },
      { id: 3, type: 'disc', date: null, data: {} },
    ] as never,
    plan: [
      { id: 10, sortOrder: 0, completed: true, isLocked: false, associatedExercises: ['values'], scheduledAt: '2024-03-01T09:00:00.000Z', instructions: 'Préparer les valeurs' },
      { id: 11, sortOrder: 1, completed: false, isLocked: true, associatedExercises: ['motivation', 'life_curve'] },
      { id: 12, sortOrder: null, completed: false, isLocked: false, associatedExercises: ['targeting'] },
      { id: 13, sortOrder: 3, completed: false, isLocked: false, associatedExercises: [] },
    ] as never,
    ...overrides,
  } as Employee
}

function stepCard(title: string) {
  return screen.getByRole('heading', { name: title }).closest('.group') as HTMLElement
}

describe('Fiche accompagné (conseiller)', () => {
  beforeEach(() => {
    resetInertiaMock()
    pdf.generateComprehensivePDF.mockReset()
    vi.mocked(alert).mockClear()
  })

  test('sans accompagné : affiche un chargement', () => {
    const { container } = renderWithUser(
      <DashboardEmployeeDetail employeeId="5" employee={null as unknown as Employee} />
    )
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  test('en-tête : identité et liens profil / synthèse / dossier', () => {
    renderWithUser(<DashboardEmployeeDetail employeeId="5" employee={makeEmployee()} />)
    expect(screen.getByRole('heading', { name: 'Camille Martin' })).toBeInTheDocument()
    expect(screen.getByText('Comptable')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voir le profil' })).toHaveAttribute('href', '/dashboard/conseiller/employees/5/profile')
    expect(screen.getByRole('link', { name: 'Synthèse' })).toHaveAttribute('href', '/dashboard/conseiller/employees/5/synthesis')
    expect(screen.getByRole('link', { name: /Télécharger le dossier/ })).toHaveAttribute('href', '/dashboard/conseiller/employees/5/dossier')
    expect(screen.getByText('Excel')).toBeInTheDocument()
  })

  test('feuille de route : statut, verrou, résultats ou exercices associés', () => {
    renderWithUser(<DashboardEmployeeDetail employeeId="5" employee={makeEmployee()} />)

    // sortOrder nul → numéroté « RDV 1 » comme la première étape
    const [done, noOrder] = screen
      .getAllByRole('heading', { name: 'RDV 1' })
      .map((h) => h.closest('.group') as HTMLElement)
    expect(within(done).getByText('Validée')).toBeInTheDocument()
    expect(within(done).getByText('Préparer les valeurs')).toBeInTheDocument()
    expect(within(done).getByRole('link', { name: /Voir les résultats/ })).toHaveAttribute(
      'href',
      '/dashboard/conseiller/employees/5/steps/10'
    )

    const locked = stepCard('RDV 2')
    expect(within(locked).getByText('Verrouillée')).toBeInTheDocument()
    expect(within(locked).getByText('2 exercices associés')).toBeInTheDocument()
    expect(within(locked).getByText('life curve')).toBeInTheDocument()
    expect(within(locked).getByTitle('Déverrouiller')).toBeInTheDocument()

    // Un seul exercice : accord au singulier
    expect(within(noOrder).getByText('1 exercice associé')).toBeInTheDocument()

    expect(within(stepCard('RDV 4')).getByText("Pas d'exercice associé")).toBeInTheDocument()
  })

  test('verrouiller / déverrouiller une étape envoie la bonne action', async () => {
    const { user } = renderWithUser(<DashboardEmployeeDetail employeeId="5" employee={makeEmployee()} />)

    await user.click(within(stepCard('RDV 2')).getByTitle('Déverrouiller'))
    expect(routerSpies.post).toHaveBeenCalledWith('/dashboard/conseiller/employees/5/steps/11/unlock', {}, { preserveScroll: true })

    await user.click(within(stepCard('RDV 4')).getByTitle('Verrouiller'))
    expect(routerSpies.post).toHaveBeenCalledWith('/dashboard/conseiller/employees/5/steps/13/lock', {}, { preserveScroll: true })
  })

  test('supprimer une étape après confirmation', async () => {
    setInertiaOutcome('success')
    const { user } = renderWithUser(<DashboardEmployeeDetail employeeId="5" employee={makeEmployee()} />)

    await user.click(within(stepCard('RDV 4')).getByTitle('Supprimer'))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText("Supprimer l'étape")).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Supprimer' }))

    expect(routerSpies.delete).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees/5/steps/13',
      expect.objectContaining({ preserveScroll: true })
    )
    expect(screen.queryByText("Supprimer l'étape")).not.toBeInTheDocument()
  })

  test('annuler la suppression ne supprime rien', async () => {
    const { user } = renderWithUser(<DashboardEmployeeDetail employeeId="5" employee={makeEmployee()} />)
    await user.click(within(stepCard('RDV 4')).getByTitle('Supprimer'))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuler' }))
    expect(routerSpies.delete).not.toHaveBeenCalled()
  })

  test('ajout et édition d’étape ouvrent l’éditeur avec le bon contexte', async () => {
    const { user } = renderWithUser(<DashboardEmployeeDetail employeeId="5" employee={makeEmployee()} />)

    await user.click(screen.getByRole('button', { name: /Ajouter un RDV/ }))
    const editor = screen.getByRole('dialog', { name: "Éditeur d'étape" })
    expect(within(editor).getByText('Nouvelle étape n°5')).toBeInTheDocument()
    expect(within(editor).getByText('Exercices faits : values,values,disc')).toBeInTheDocument()
    await user.click(within(editor).getByRole('button', { name: 'Fermer l’éditeur' }))
    expect(screen.queryByRole('dialog', { name: "Éditeur d'étape" })).not.toBeInTheDocument()

    await user.click(within(stepCard('RDV 2')).getByTitle('Modifier'))
    expect(screen.getByText('Édition étape 11')).toBeInTheDocument()
  })

  test('notes d’accompagnement enregistrées à la perte de focus', async () => {
    const { user } = renderWithUser(<DashboardEmployeeDetail employeeId="5" employee={makeEmployee()} />)
    const textarea = screen.getByDisplayValue('Suivi hebdo')
    await user.type(textarea, ' + point mensuel')
    await user.tab()
    expect(routerSpies.put).toHaveBeenCalledWith('/dashboard/conseiller/employees/5', {
      advisorNotes: 'Suivi hebdo + point mensuel',
    })
  })

  test('résultats : le plus récent par type, avec lien vers le détail', () => {
    renderWithUser(<DashboardEmployeeDetail employeeId="5" employee={makeEmployee()} />)
    const links = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('href')?.includes('/exercises/results/'))
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/dashboard/conseiller/employees/5/exercises/results/values',
      '/dashboard/conseiller/employees/5/exercises/results/disc',
    ])
    expect(links[0]).toHaveTextContent('15 mars 2024')
    expect(links[1]).toHaveTextContent('Complété le —')
  })

  test('sans exercice réalisé : message dédié et rapport expert désactivé', () => {
    renderWithUser(
      <DashboardEmployeeDetail
        employeeId="5"
        employee={makeEmployee({ exercises: [], plan: [], advisorNotes: undefined })}
      />
    )
    expect(screen.getByText(/Aucun exercice réalisé/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Rapport Expert/ })).toBeDisabled()
  })

  test('les notes de suivi sont affichées', () => {
    renderWithUser(
      <DashboardEmployeeDetail employeeId="5" employee={makeEmployee()} notes={[makeNote({ content: 'Relancer' })]} />
    )
    expect(screen.getByText('Notes de suivi')).toBeInTheDocument()
    expect(screen.getByText('Relancer')).toBeInTheDocument()
  })

  test('rapport expert : génère le PDF, et alerte en cas d’erreur', async () => {
    const employee = makeEmployee()
    const { user } = renderWithUser(<DashboardEmployeeDetail employeeId="5" employee={employee} />)

    await user.click(screen.getByRole('button', { name: /Rapport Expert/ }))
    await waitFor(() => expect(pdf.generateComprehensivePDF).toHaveBeenCalledWith(employee))

    pdf.generateComprehensivePDF.mockRejectedValueOnce(new Error('KO'))
    await user.click(screen.getByRole('button', { name: /Rapport Expert/ }))
    await waitFor(() => expect(alert).toHaveBeenCalledWith('Erreur PDF.'))
  })
})
