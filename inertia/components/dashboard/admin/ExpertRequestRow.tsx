import { useForm } from '@inertiajs/react'
import { useState } from 'react'
import {
  EXPERT_REQUEST_DECLINE_REASON_MAX,
  EXPERT_REQUEST_PATHS,
  EXPERT_REQUEST_STATUS_LABELS,
  EXPERT_REQUEST_STATUSES,
} from '#shared/constants/expert_request'
import { formatDateTimeFR } from '#shared/helpers/date'
import type { AdminExpertRequestRow, PlatformTeamMember } from '#shared/types/expert_request/admin'
import { AssignExpertForm } from '~/components/dashboard/admin/AssignExpertForm'
import Badge, { type BadgeVariant } from '~/components/ui/Badge'
import Button from '~/components/ui/Button'
import Card from '~/components/ui/Card'
import { Textarea } from '~/components/ui/Textarea'

const TONE_BY_STATUS: Record<AdminExpertRequestRow['status'], BadgeVariant> = {
  [EXPERT_REQUEST_STATUSES.PENDING]: 'warning',
  [EXPERT_REQUEST_STATUSES.ACCEPTED]: 'success',
  [EXPERT_REQUEST_STATUSES.DECLINED]: 'danger',
  [EXPERT_REQUEST_STATUSES.CLOSED]: 'neutral',
}

interface ExpertRequestRowProps {
  request: AdminExpertRequestRow
  experts: PlatformTeamMember[]
}

/** Une demande d'accompagnement dans le back-office (#105) : contexte, assignation ou refus. */
export function ExpertRequestRow({ request, experts }: ExpertRequestRowProps) {
  const [declining, setDeclining] = useState(false)
  const decline = useForm({ reason: '' })
  const isPending = request.status === EXPERT_REQUEST_STATUSES.PENDING

  return (
    <li aria-label={`Demande de ${request.candidate.name}`}>
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-title-sm text-ink">{request.candidate.name}</h2>
            <p className="text-sm text-muted">
              {request.candidate.email} · demande du {formatDateTimeFR(request.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={request.candidate.hasPaidAccess ? 'success' : 'warning'}>
              {request.candidate.hasPaidAccess ? 'Forfait réglé' : 'Forfait non réglé'}
            </Badge>
            <Badge variant={TONE_BY_STATUS[request.status]} dot>
              {EXPERT_REQUEST_STATUS_LABELS[request.status]}
            </Badge>
          </div>
        </div>

        <blockquote className="rounded-lg border-l-2 border-accent bg-surface-soft px-4 py-3 text-sm text-ink-soft">
          {request.message}
        </blockquote>
        {request.availability && (
          <p className="text-sm text-muted">Disponibilités : {request.availability}</p>
        )}

        {request.assignedExpert && (
          <p className="text-sm text-ink-soft">
            Expert assigné :{' '}
            <span className="font-medium text-ink">{request.assignedExpert.name}</span>
            {request.handledBy && ` · par ${request.handledBy.name}`}
            {request.handledAt && ` le ${formatDateTimeFR(request.handledAt)}`}
          </p>
        )}
        {request.status === EXPERT_REQUEST_STATUSES.DECLINED && (
          <p className="text-sm text-ink-soft">
            Refusée{request.handledBy && ` par ${request.handledBy.name}`}
            {request.declineReason && ` : ${request.declineReason}`}
          </p>
        )}

        {isPending && !declining && (
          <div className="space-y-3 border-t border-hairline pt-4">
            <AssignExpertForm requestId={request.id} experts={experts} />
            <Button type="button" variant="ghost" size="sm" onClick={() => setDeclining(true)}>
              Refuser la demande
            </Button>
          </div>
        )}

        {isPending && declining && (
          <form
            className="space-y-3 border-t border-hairline pt-4"
            aria-label="Refuser la demande"
            onSubmit={(event) => {
              event.preventDefault()
              decline.post(EXPERT_REQUEST_PATHS.adminDecline(request.id), { preserveScroll: true })
            }}
          >
            <Textarea
              label="Motif du refus"
              name="reason"
              required
              rows={3}
              maxLength={EXPERT_REQUEST_DECLINE_REASON_MAX}
              value={decline.data.reason}
              onChange={(e) => decline.setData('reason', e.target.value)}
              error={decline.errors.reason}
              hint="Transmis tel quel au candidat, qui pourra déposer une nouvelle demande."
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="danger" size="sm" isLoading={decline.processing}>
                Confirmer le refus
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setDeclining(false)}>
                Annuler
              </Button>
            </div>
          </form>
        )}
      </Card>
    </li>
  )
}
