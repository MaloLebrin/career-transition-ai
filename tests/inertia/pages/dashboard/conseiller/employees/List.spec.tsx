import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import DashboardEmployees from '../../../../../../inertia/pages/dashboard/conseiller/employees/List'
import type { Employee } from '../../../../../../inertia/types/employee'

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return { ...actual, Head: () => null }
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
  EmployeesTable: ({
    employees,
    allEmployeesCount,
  }: {
    employees: Employee[]
    allEmployeesCount: number
  }) => (
    <div data-testid="employees-table" data-all-count={allEmployeesCount}>
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

describe('DashboardEmployees (List)', () => {
  test('affiche le titre et le nombre de candidats', () => {
    const employees = [makeEmployee(), makeEmployee({ id: 2, name: 'Marie Bernard' })]
    render(<DashboardEmployees employees={employees} />)
    expect(screen.getByText(/Candidats/)).toBeInTheDocument()
    expect(screen.getByText('(2)')).toBeInTheDocument()
  })

  test('passe tous les candidats à EmployeesTable sans filtre', () => {
    const employees = [makeEmployee({ id: 1 }), makeEmployee({ id: 2, name: 'Marie Bernard' })]
    render(<DashboardEmployees employees={employees} />)
    const rows = screen.getAllByTestId('employee-row')
    expect(rows).toHaveLength(2)
  })

  test('passe allEmployeesCount correct à EmployeesTable', () => {
    const employees = [makeEmployee({ id: 1 }), makeEmployee({ id: 2 })]
    render(<DashboardEmployees employees={employees} />)
    expect(screen.getByTestId('employees-table')).toHaveAttribute('data-all-count', '2')
  })

  test('filtre les candidats par nom', () => {
    const employees = [
      makeEmployee({ id: 1, name: 'Jean Dupont', email: 'jean@exemple.fr' }),
      makeEmployee({ id: 2, name: 'Marie Bernard', email: 'marie@exemple.fr' }),
    ]
    render(<DashboardEmployees employees={employees} />)
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'jean' } })
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    expect(screen.queryByText('Marie Bernard')).not.toBeInTheDocument()
  })

  test('filtre les candidats par email', () => {
    const employees = [
      makeEmployee({ id: 1, name: 'Jean Dupont', email: 'jean@exemple.fr' }),
      makeEmployee({ id: 2, name: 'Marie Bernard', email: 'marie@exemple.fr' }),
    ]
    render(<DashboardEmployees employees={employees} />)
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'marie' } })
    expect(screen.queryByText('Jean Dupont')).not.toBeInTheDocument()
    expect(screen.getByText('Marie Bernard')).toBeInTheDocument()
  })

  test('filtre les candidats par statut', () => {
    const employees = [
      makeEmployee({ id: 1, name: 'Jean Dupont', status: 'active' }),
      makeEmployee({ id: 2, name: 'Marie Bernard', status: 'completed' }),
    ]
    render(<DashboardEmployees employees={employees} />)
    fireEvent.change(screen.getByTestId('status-select'), { target: { value: 'active' } })
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    expect(screen.queryByText('Marie Bernard')).not.toBeInTheDocument()
  })

  test('ouvre la modale AddEmployee au clic sur le bouton', () => {
    render(<DashboardEmployees employees={[]} />)
    expect(screen.queryByTestId('add-employee-modal')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('+ Nouveau candidat'))
    expect(screen.getByTestId('add-employee-modal')).toBeInTheDocument()
  })

  test('ferme la modale AddEmployee', () => {
    render(<DashboardEmployees employees={[]} />)
    fireEvent.click(screen.getByText('+ Nouveau candidat'))
    fireEvent.click(screen.getByText('Fermer'))
    expect(screen.queryByTestId('add-employee-modal')).not.toBeInTheDocument()
  })
})
