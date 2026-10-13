import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import DashboardEmployees from '../../../../../../inertia/pages/dashboard/conseiller/employees/List'
import type { Employee } from '../../../../../../inertia/types/employee'
import { SEARCH_DEBOUNCE_MS } from '../../../../../../inertia/hooks/use_server_list'
import { resetInertiaMock, routerSpies } from '../../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}))

vi.mock('../../../../../../inertia/components/modals/AddEmployeeModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="add-employee-modal">
      <button onClick={onClose}>Fermer</button>
    </div>
  ),
}))

vi.mock('../../../../../../inertia/components/dashboard/advisor/employees/EmployeesTable', () => ({
  EmployeesTable: ({ employees, hasFilters }: { employees: Employee[]; hasFilters?: boolean }) => (
    <div data-testid="employees-table" data-has-filters={String(Boolean(hasFilters))}>
      {employees.map((e) => (
        <div key={e.id} data-testid="employee-row">
          {e.name}
        </div>
      ))}
    </div>
  ),
}))

vi.mock('../../../../../../inertia/components/ui/Input', () => ({
  default: ({ value, onChange, placeholder }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input data-testid="search-input" value={value} onChange={onChange} placeholder={placeholder} />
  ),
}))

vi.mock('../../../../../../inertia/components/ui/SelectField', () => ({
  default: ({
    value,
    onChange,
    options,
  }: {
    value: string
    onChange: (v: string) => void
    options: { value: string; label: string }[]
  }) => (
    <select data-testid="status-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}))

vi.mock('../../../../../../inertia/components/ui/Button', () => ({
  default: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}))

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
    plan: [],
    ...overrides,
  }
}

const PAGINATION = { page: 1, pageSize: 25, total: 2, lastPage: 1 }
const NO_FILTERS = { search: '', status: 'all' as const }

function renderList(
  props: Partial<{
    employees: Employee[]
    pagination: typeof PAGINATION
    filters: { search: string; status: string }
  }> = {}
) {
  return render(
    <DashboardEmployees
      employees={
        props.employees ?? [makeEmployee(), makeEmployee({ id: 2, name: 'Marie Bernard' })]
      }
      pagination={props.pagination ?? PAGINATION}
      filters={(props.filters ?? NO_FILTERS) as never}
    />
  )
}

describe('DashboardEmployees (List)', () => {
  beforeEach(() => {
    resetInertiaMock()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  test('affiche le titre et le total du serveur (pas la taille de la page)', () => {
    renderList({ pagination: { ...PAGINATION, total: 137, lastPage: 6 } })
    expect(screen.getByText(/Candidats/)).toBeInTheDocument()
    expect(screen.getByText('(137)')).toBeInTheDocument()
  })

  test('passe les candidats de la page à EmployeesTable, sans filtre actif', () => {
    renderList()
    expect(screen.getAllByTestId('employee-row')).toHaveLength(2)
    expect(screen.getByTestId('employees-table')).toHaveAttribute('data-has-filters', 'false')
  })

  test('signale à la table qu’un filtre est actif', () => {
    renderList({ filters: { search: 'zzz', status: 'all' } })
    expect(screen.getByTestId('employees-table')).toHaveAttribute('data-has-filters', 'true')
  })

  test('initialise le champ de recherche et le statut depuis les filtres du serveur', () => {
    renderList({ filters: { search: 'jean', status: 'completed' } })
    expect(screen.getByTestId('search-input')).toHaveValue('jean')
    expect(screen.getByTestId('status-select')).toHaveValue('completed')
  })

  test('la recherche part au serveur après le délai, sans filtrer localement', () => {
    renderList()
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'jean' } })

    expect(routerSpies.get).not.toHaveBeenCalled()
    expect(screen.getByText('Marie Bernard')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
    })
    expect(routerSpies.get).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees',
      { search: 'jean' },
      expect.objectContaining({ preserveState: true, only: expect.arrayContaining(['employees']) })
    )
  })

  test('le statut part immédiatement au serveur', () => {
    renderList()
    fireEvent.change(screen.getByTestId('status-select'), { target: { value: 'active' } })

    expect(routerSpies.get).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees',
      { status: 'active' },
      expect.anything()
    )
  })

  test('affiche la pagination et change de page en gardant les filtres', () => {
    renderList({
      pagination: { page: 1, pageSize: 25, total: 60, lastPage: 3 },
      filters: { search: 'ma', status: 'all' },
    })

    expect(screen.getByText('Page 1 / 3')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }))
    expect(routerSpies.get).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees',
      { search: 'ma', page: '2' },
      expect.anything()
    )
  })

  test('pas de pagination pour une seule page', () => {
    renderList()
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument()
  })

  test('ouvre la modale AddEmployee au clic sur le bouton', () => {
    renderList({ employees: [] })
    expect(screen.queryByTestId('add-employee-modal')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('+ Nouveau candidat'))
    expect(screen.getByTestId('add-employee-modal')).toBeInTheDocument()
  })

  test('ferme la modale AddEmployee', () => {
    renderList({ employees: [] })
    fireEvent.click(screen.getByText('+ Nouveau candidat'))
    fireEvent.click(screen.getByText('Fermer'))
    expect(screen.queryByTestId('add-employee-modal')).not.toBeInTheDocument()
  })
})
