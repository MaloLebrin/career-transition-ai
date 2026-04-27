import { router, usePage } from '@inertiajs/react'
import type { UserSession } from '../types/auth'

export function useAuth() {
  const { props } = usePage<{ csrfToken?: string; user?: UserSession }>()
  const csrfToken = props.csrfToken
  const user = props.user ?? null
  const loading = false
  const error: string | null = null

  const logout = async () => {
    router.post('/auth/logout', csrfToken ? { _csrf: csrfToken } : {}, {
      onFinish: () => {
        router.visit('/auth/login')
      },
    })
  }

  return { user, loading, error, logout }
}
