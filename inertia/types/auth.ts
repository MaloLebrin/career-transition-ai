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
  /** Adresse e-mail confirmée par lien (#98) ; le bandeau ne concerne que les `b2c`. */
  emailVerified: boolean
  /** Membre de l'équipe d'experts de la plateforme : seul à avoir accès à la messagerie expert. */
  isPlatformTeam?: boolean
}
