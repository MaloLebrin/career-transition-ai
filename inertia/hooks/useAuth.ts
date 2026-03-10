import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import type { UserSession } from '../types/auth'

export function useAuth() {
  const { props } = usePage<{ csrfToken?: string; user?: UserSession }>()
  const csrfToken = props.csrfToken
  const sharedUser = props.user ?? null

  const [stateUser] = useState<UserSession | null>(null)
  const loading = false
  const [error, setError] = useState<string | null>(null)

  const user = sharedUser ?? stateUser

  const logout = async () => {
    setError(null)
    router.post('/auth/logout', csrfToken ? { _csrf: csrfToken } : {}, {
      onFinish: () => {
        router.visit('/auth/login')
      },
    })
  }

  return { user, loading, error, logout }
}
