import { useState, useEffect, useMemo } from 'react'
import { Employee } from '../types'
import { apiService } from '../services/apiService'
import { useAuth } from './useAuth'

export function useEmployees(searchTerm: string = '') {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchAll = async () => {
    try {
      setLoading(true)
      // Filtrage automatique basé sur la session du professionnel
      const organizationId = user?.organizationId
      const advisorId = user?.role === 'advisor' ? user.id : undefined

      const data = await apiService.fetchEmployees(organizationId, advisorId)
      setEmployees(data)
    } catch (err) {
      setError('Erreur lors du chargement des candidats.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [user])

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
    loading,
    error,
    refresh: fetchAll,
  }
}
