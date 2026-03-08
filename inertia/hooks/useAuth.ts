import { useState, useEffect } from 'react'
import { usePage, router } from '@inertiajs/react'
import { authService, type UserSession } from '../services/authService'

export function useAuth() {
  const { props } = usePage<{ csrfToken?: string; user?: UserSession }>()
  const csrfToken = props.csrfToken
  const sharedUser = props.user ?? null

  const [stateUser, setStateUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(!sharedUser)
  const [error, setError] = useState<string | null>(null)

  const user = sharedUser ?? stateUser

  useEffect(() => {
    if (sharedUser) {
      setLoading(false)
      return
    }
    authService.getCurrentSession().then((session) => {
      if (session) setStateUser(session)
      setLoading(false)
    })
  }, [sharedUser])

  const login = async (email: string, password: string) => {
    setError(null)
    try {
      const session = await authService.login(email, password, csrfToken)
      setStateUser(session)
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
      setStateUser(session)
      return session
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const logout = async () => {
    await authService.logout(csrfToken)
    setStateUser(null)
    router.visit('/auth/login')
  }

  return { user, loading, error, login, register, logout }
}
