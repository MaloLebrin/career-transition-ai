export interface UserSession {
  id: number
  organizationId: number
  email: string
  name: string
  role: 'advisor' | 'employee' | 'admin' | 'super_admin'
}

function headersWithCsrf(csrfToken: string | undefined, extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...extra,
  }
  if (csrfToken) {
    headers['X-CSRF-TOKEN'] = csrfToken
  }
  return headers
}

export const authService = {
  async login(email: string, password: string, csrfToken?: string): Promise<UserSession> {
    const response = await fetch('/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: headersWithCsrf(csrfToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body?.message || 'Identifiants invalides.')
    }

    return (await response.json()) as UserSession
  },

  async register(
    email: string,
    password: string,
    name: string,
    role: 'advisor' | 'employee',
    csrfToken?: string
  ): Promise<UserSession> {
    const response = await fetch('/auth/register', {
      method: 'POST',
      credentials: 'include',
      headers: headersWithCsrf(csrfToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email, password, name, role }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body?.message || "Erreur lors de la création du compte.")
    }

    return (await response.json()) as UserSession
  },

  async logout(csrfToken?: string): Promise<void> {
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: headersWithCsrf(csrfToken),
    })
  },

  async getCurrentSession(): Promise<UserSession | null> {
    const response = await fetch('/auth/me', {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    })

    if (response.status === 401) {
      return null
    }

    if (!response.ok) {
      return null
    }

    return (await response.json()) as UserSession
  },
}
