import { useState, useEffect } from 'react'
import { usePage } from '@inertiajs/react'
import { authService, type UserSession } from '../services/authService'

export function useAuth() {
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { props } = usePage<{ csrfToken?: string }>()
  const csrfToken = props.csrfToken

  useEffect(() => {
    const session = authService.getCurrentSession()
    if (session) setUser(session)
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setError(null)
    try {
      const session = await authService.login(email, password, csrfToken)
      setUser(session)
      return session
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const register = async (
    email: string,
    password: string,
    name: string,
    role: 'advisor' | 'employee'
  ) => {
    setError(null)
    try {
      const session = await authService.register(email, password, name, role, csrfToken)
      setUser(session)
      return session
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const logout = () => {
    authService.logout(csrfToken)
    setUser(null)
  }

  return { user, loading, error, login, register, logout }
}

