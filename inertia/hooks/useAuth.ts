
import { useState, useEffect } from 'react'
import { authService, type UserSession } from '../services/authService'

export function useAuth() {
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const session = authService.getCurrentSession()
    if (session) setUser(session)
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setError(null)
    try {
      const session = await authService.login(email, password)
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
      const session = await authService.register(email, password, name, role)
      setUser(session)
      return session
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  return { user, loading, error, login, register, logout }
}

