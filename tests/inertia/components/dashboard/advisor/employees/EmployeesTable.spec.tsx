import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { EmployeesTable } from '../../../../../../inertia/components/dashboard/advisor/employees/EmployeesTable'
import type { Employee } from '../../../../../../inertia/types/employee'

const { mockRouterVisit } = vi.hoisted(() => ({ mockRouterVisit: vi.fn() }))

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return { ...actual, router: { visit: mockRouterVisit } }
})

vi.mock(
  '../../../../../../inertia/components/dashboard/advisor/home/accompaniment/AccompanimentStatusBadge',
  () => ({
    AccompanimentStatusBadge: ({ status }: { status: string }) => (
      <span data-testid="status-badge">{status}</span>
    ),
  })
)

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 1,
    organizationId: 1,
    name: 'Jean Dupont',
    email: 'jean@exemple.fr',
    currentRole: 'Développeur senior',
    targetRole: 'CTO',
    status: 'active',
    onboarded: true,
    skills: [],
    experiences: [],
    educations: [],
    exercises: [],
    plan: [
      { id: 1, completed: true, status: 'completed' },
      { id: 2, completed: false, status: 'scheduled' },
      { id: 3, completed: true, status: 'completed' },
    ],
    ...overrides,
  }
}

describe('EmployeesTable', () => {
  beforeEach(() => {
    mockRouterVisit.mockClear()
  })

  test('affiche les en-têtes de colonnes', () => {
    render(<EmployeesTable employees={[]} allEmployeesCount={0} />)
    expect(screen.getByText('Candidat')).toBeInTheDocument()
    expect(screen.getByText('Rôle actuel')).toBeInTheDocument()
    expect(screen.getByText('Objectif')).toBeInTheDocument()
    expect(screen.getByText('Statut')).toBeInTheDocument()
    expect(screen.getByText('Progression')).toBeInTheDocument()
    expect(screen.getByText('Accompagné')).toBeInTheDocument()
  })

  test('affiche nom, email et rôle actuel du candidat', () => {
    render(<EmployeesTable employees={[makeEmployee()]} allEmployeesCount={1} />)
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    expect(screen.getByText('jean@exemple.fr')).toBeInTheDocument()
    expect(screen.getByText('Développeur senior')).toBeInTheDocument()
  })

  test('affiche le targetRole quand il est défini', () => {
    render(
      <EmployeesTable employees={[makeEmployee({ targetRole: 'CTO' })]} allEmployeesCount={1} />
    )
    expect(screen.getByText('CTO')).toBeInTheDocument()
  })

  test('affiche "—" quand targetRole est absent', () => {
    render(
      <EmployeesTable employees={[makeEmployee({ targetRole: undefined })]} allEmployeesCount={1} />
    )
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  test('affiche la progression correcte', () => {
    const employee = makeEmployee({
      plan: [
        { id: 1, completed: true, status: 'completed' },
        { id: 2, completed: false, status: 'scheduled' },
        { id: 3, completed: true, status: 'completed' },
      ],
    })
    render(<EmployeesTable employees={[employee]} allEmployeesCount={1} />)
    expect(screen.getByText('2/3')).toBeInTheDocument()
  })

  test('affiche "Oui" quand le candidat est accompagné', () => {
    render(<EmployeesTable employees={[makeEmployee({ onboarded: true })]} allEmployeesCount={1} />)
    expect(screen.getByText('Oui')).toBeInTheDocument()
  })

  test('affiche "En attente" quand le candidat n\'est pas accompagné', () => {
    render(
      <EmployeesTable employees={[makeEmployee({ onboarded: false })]} allEmployeesCount={1} />
    )
    expect(screen.getByText('En attente')).toBeInTheDocument()
  })

  test('navigue vers la fiche au clic sur une ligne', () => {
    render(<EmployeesTable employees={[makeEmployee({ id: 42 })]} allEmployeesCount={1} />)
    fireEvent.click(screen.getByText('Jean Dupont').closest('tr')!)
    expect(mockRouterVisit).toHaveBeenCalledWith('/dashboard/conseiller/employees/42')
  })

  test('affiche le message vide quand employees est vide et allEmployeesCount > 0', () => {
    render(<EmployeesTable employees={[]} allEmployeesCount={3} />)
    expect(
      screen.getByText('Aucun candidat ne correspond à vos critères de recherche.')
    ).toBeInTheDocument()
  })

  test('affiche le message initial quand employees est vide et allEmployeesCount === 0', () => {
    render(<EmployeesTable employees={[]} allEmployeesCount={0} />)
    expect(
      screen.getByText('Aucun candidat pour le moment. Créez votre premier candidat !')
    ).toBeInTheDocument()
  })

  test('affiche une ligne par candidat', () => {
    const employees = [
      makeEmployee({ id: 1, name: 'Jean Dupont' }),
      makeEmployee({ id: 2, name: 'Marie Bernard' }),
    ]
    render(<EmployeesTable employees={employees} allEmployeesCount={2} />)
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    expect(screen.getByText('Marie Bernard')).toBeInTheDocument()
  })
})
