import { EMPLOYEE_STATUS_TRANSLATIONS, EMPLOYEES_STATUS, type EmployeeStatus } from '#shared/constants/employee'
import { Head } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import { EmployeesTable } from '~/components/dashboard/advisor/employees/EmployeesTable'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import AddEmployeeModal from '~/components/modals/AddEmployeeModal'
import Button from '~/components/ui/Button'
import Input from '~/components/ui/Input'
import SelectField, { type SelectFieldOption } from '~/components/ui/SelectField'
import type { Employee } from '~/types/employee'

interface DashboardEmployeesProps {
  employees: Employee[]
}

const STATUS_OPTIONS: SelectFieldOption<EmployeeStatus | 'all'>[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: EMPLOYEES_STATUS.ACTIVE, label: EMPLOYEE_STATUS_TRANSLATIONS[EMPLOYEES_STATUS.ACTIVE] },
  { value: EMPLOYEES_STATUS.ONBOARDING, label: EMPLOYEE_STATUS_TRANSLATIONS[EMPLOYEES_STATUS.ONBOARDING] },
  { value: EMPLOYEES_STATUS.ON_HOLD, label: EMPLOYEE_STATUS_TRANSLATIONS[EMPLOYEES_STATUS.ON_HOLD] },
  { value: EMPLOYEES_STATUS.COMPLETED, label: EMPLOYEE_STATUS_TRANSLATIONS[EMPLOYEES_STATUS.COMPLETED] },
  { value: EMPLOYEES_STATUS.ARCHIVED, label: EMPLOYEE_STATUS_TRANSLATIONS[EMPLOYEES_STATUS.ARCHIVED] },
]


export default function DashboardEmployees({ employees }: DashboardEmployeesProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'all'>('all')
  const [addOpen, setAddOpen] = useState(false)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return employees.filter((e) => {
      const matchesSearch =
        !term ||
        e.name.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term)
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [employees, search, statusFilter])

  return (
    <>
      <Head title="Candidats" />
      <DashboardLayout>
        <div className="space-y-8 animate-fadeIn">
          {addOpen && <AddEmployeeModal onClose={() => setAddOpen(false)} />}

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.25em]">
                Dashboard conseiller
              </p>
              <h1 className="text-3xl font-bold text-brand-navy tracking-tight">
                Candidats{' '}
                <span className="text-brand-navy/30 font-medium text-2xl">
                  ({employees.length})
                </span>
              </h1>
              <p className="text-brand-navy/60 text-sm font-medium">
                Cliquez sur une ligne pour accéder à la fiche du candidat.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:items-center md:justify-end">
              <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
                + Nouveau candidat
              </Button>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou email…"
                type="search"
              />
              <SelectField<EmployeeStatus | 'all'>
                aria-label="Filtrer par statut"
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                className="shrink-0 w-full sm:min-w-[180px] sm:max-w-[240px]"
              />
            </div>
          </div>

          <EmployeesTable employees={filtered} allEmployeesCount={employees.length} />
        </div>
      </DashboardLayout>
    </>
  )
}
