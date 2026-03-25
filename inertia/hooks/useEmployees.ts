import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Employee } from '~/types'
import { useAuth } from '~/hooks/useAuth'
import { apiService } from '~/services/apiService'

export function useEmployees(search: string) {
  const { user } = useAuth()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) {
      setEmployees([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await apiService.fetchEmployees(user.organizationId, user.id)
      setEmployees((data as any) ?? [])
    } catch {
      setEmployees([])
      setError('Erreur lors du chargement des candidats.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return employees
    return employees.filter(
      (e) => e.name.toLowerCase().includes(term) || e.email.toLowerCase().includes(term)
    )
  }, [employees, search])

  return {
    employees,
    filteredEmployees,
    loading,
    error,
    refresh: load,
  }
}

