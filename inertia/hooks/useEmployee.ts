import { useCallback, useEffect, useState } from 'react'
import type { Employee } from '~/types'
import { apiService } from '~/services/apiService'

export function useEmployee(id: string | number | null) {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (id === null || id === undefined) {
      setEmployee(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await apiService.fetchEmployeeById(String(id))
      setEmployee(data as any)
    } catch {
      setEmployee(null)
      setError('Erreur lors de la récupération du profil.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  return {
    employee,
    loading,
    error,
    refreshEmployee: load,
  }
}

