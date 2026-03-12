import { useState, useEffect, useCallback } from 'react'
import type { Employee } from '../types'

export function useEmployee(id: string | number | null, initial?: Employee | null) {
  const [employee, setEmployee] = useState<Employee | null>(initial ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (id === null || id === undefined) {
      setEmployee(null)
      return
    }
    // On ne fetch plus via API. L'employé doit être présent via props ou initial load Inertia.
    setLoading(false)
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
