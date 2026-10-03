import type { ExpertRequestStatus, ExpertSupportLockReason } from '#shared/constants/expert_request'

/** Une demande telle qu'affichée au candidat (#103). */
export interface ExpertRequestView {
  id: number
  status: ExpertRequestStatus
  message: string
  availability: string | null
  createdAt: string
  handledAt: string | null
  declineReason: string | null
}

/** Page `/dashboard/candidat/accompagnement`. */
export interface ExpertSupportView {
  /** Particulier au forfait réglé : il peut déposer une demande. */
  eligible: boolean
  lockedReason: ExpertSupportLockReason | null
  /** Demande la plus récente, `null` s'il n'y en a aucune. */
  request: ExpertRequestView | null
  /** Expert assigné (nom seul), `null` sinon. */
  expert: { name: string } | null
}
