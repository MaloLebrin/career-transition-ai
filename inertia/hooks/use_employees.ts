import { usePage } from '@inertiajs/react'
import { useMemo } from 'react'
import { Employee } from '../types'

export function useEmployees(searchTerm: string = '') {
  const { props } = usePage<{ employees: Employee[] }>()
  const employees = props.employees ?? []

  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [employees, searchTerm])

  return {
    employees,
    filteredEmployees,
    loading: false,
    error: null,
    refresh: () => {
      // Pour Inertia, un refresh se fait via router.reload() ou via le middleware automatiquement
    },
  }
}
