export interface UserSession {
  id: number
  organizationId: number
  email: string
  name: string
  role: 'advisor' | 'employee' | 'admin' | 'super_admin'
}

