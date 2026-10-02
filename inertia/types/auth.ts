import type { AccountType } from '#shared/constants/b2c'
import type { UserRole } from '#shared/types/advisor/roles'

export interface UserSession {
  id: number
  organizationId: number
  email: string
  name: string
  role: UserRole
  /** `b2b` | `b2c` pour un candidat, `null` sinon (#92). */
  accountType: AccountType | null
}
