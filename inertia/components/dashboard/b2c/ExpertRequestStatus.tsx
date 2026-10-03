import { UserRound } from 'lucide-react'
import {
  EXPERT_REQUEST_STATUS_LABELS,
  EXPERT_REQUEST_STATUSES,
} from '#shared/constants/expert_request'
import { formatDateTimeFR } from '#shared/helpers/date'
import type { ExpertRequestView } from '#shared/types/expert_request/views'
import Badge, { type BadgeVariant } from '~/components/ui/Badge'
import Card from '~/components/ui/Card'

const TONE_BY_STATUS: Record<ExpertRequestView['status'], BadgeVariant> = {
  [EXPERT_REQUEST_STATUSES.PENDING]: 'warning',
  [EXPERT_REQUEST_STATUSES.ACCEPTED]: 'success',
  [EXPERT_REQUEST_STATUSES.DECLINED]: 'danger',
  [EXPERT_REQUEST_STATUSES.CLOSED]: 'neutral',
}

interface ExpertRequestStatusProps {
  request: ExpertRequestView
  /** Expert assigné à ce jour, affiché quand la demande est acceptée. */
  expert: { name: string } | null
}

/** Dernière demande d'accompagnement du candidat (#103) : statut, message, suite donnée. */
export function ExpertRequestStatus({ request, expert }: ExpertRequestStatusProps) {
  return (
    <Card className="space-y-4" role="status" aria-label="Votre demande d’accompagnement">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-title-md text-ink">Votre demande d’accompagnement</h2>
          <p className="text-sm text-muted">Envoyée le {formatDateTimeFR(request.createdAt)}</p>
        </div>
        <Badge variant={TONE_BY_STATUS[request.status]} dot>
          {EXPERT_REQUEST_STATUS_LABELS[request.status]}
        </Badge>
      </div>

      <blockquote className="rounded-lg border-l-2 border-accent bg-surface-soft px-4 py-3 text-sm text-ink-soft">
        {request.message}
      </blockquote>
      {request.availability && (
        <p className="text-sm text-muted">Disponibilités : {request.availability}</p>
      )}

      {request.status === EXPERT_REQUEST_STATUSES.PENDING && (
        <p className="text-sm text-ink-soft">
          Un expert prend connaissance de votre demande et vous contactera prochainement.
        </p>
      )}
      {request.status === EXPERT_REQUEST_STATUSES.ACCEPTED && expert && (
        <div className="flex items-start gap-3 rounded-lg bg-accent-soft p-4">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-accent"
            aria-hidden="true"
          >
            <UserRound className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="text-title-sm text-ink">Votre expert : {expert.name}</p>
            <p className="text-sm text-ink-soft">
              Il suit désormais votre parcours et peut vous proposer des étapes et des notes.
            </p>
          </div>
        </div>
      )}
      {request.status === EXPERT_REQUEST_STATUSES.DECLINED && (
        <p className="text-sm text-ink-soft">
          {request.declineReason
            ? `Demande refusée : ${request.declineReason}`
            : 'Demande refusée. Vous pouvez en déposer une nouvelle.'}
        </p>
      )}
    </Card>
  )
}
