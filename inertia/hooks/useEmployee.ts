import { useState, useEffect, useCallback } from 'react'
import type { Employee } from '../types'
import { apiService } from '../services/apiService'

export function useEmployee(id: string | number | null, initial?: Employee | null) {
  const [employee, setEmployee] = useState<Employee | null>(initial ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (id === null || id === undefined) {
      setEmployee(null)
      return
    }
    setLoading(true)
    try {
      const data = await apiService.fetchEmployeeById(id)
      setEmployee(data)
    } catch (err) {
      setError('Erreur lors de la récupération du profil.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (initial) {
      return
    }
    load()
  }, [initial, load])

  return {
    employee,
    loading,
    error,
    refreshEmployee: load,
  }
}
