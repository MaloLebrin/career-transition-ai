import type { AccountType } from '#shared/constants/b2c'
import type { UserRole } from '#shared/types/advisor/roles'

export type UserSessionDto = {
  id: number
  organizationId: number
  email: string
  name: string
  role: UserRole
  /** Type de la fiche candidat liée (`employee` seulement), `null` sinon (#92). */
  accountType?: AccountType | null
  /** Adresse e-mail confirmée par lien (#98) ; posée par la prop partagée `user`. */
  emailVerified?: boolean
}
