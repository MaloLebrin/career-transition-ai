import type { ExpertRequestStatus } from '#shared/constants/expert_request'
import type { PlatformTeamRole } from '#shared/constants/roles'

/** Une demande d'accompagnement vue du back-office super admin (#105). */
export interface AdminExpertRequestRow {
  id: number
  status: ExpertRequestStatus
  message: string
  availability: string | null
  createdAt: string
  handledAt: string | null
  declineReason: string | null
  candidate: { id: number; name: string; email: string; hasPaidAccess: boolean }
  assignedExpert: { id: number; name: string } | null
  handledBy: { id: number; name: string } | null
}

/** Membre de l'équipe interne (organisation plateforme), assignable comme expert. */
export interface PlatformTeamMember {
  id: number
  name: string
  email: string
  role: PlatformTeamRole
  onboardingCompleted: boolean
  /** Particuliers dont il est l'expert (`employees.advisor_id`). */
  assignedCandidatesCount: number
}

export interface AssignExpertInput {
  requestId: number
  expertUserId: number
}

export interface DeclineExpertRequestInput {
  requestId: number
  reason: string
}

export interface InvitePlatformMemberInput {
  name: string
  email: string
  role: PlatformTeamRole
}
