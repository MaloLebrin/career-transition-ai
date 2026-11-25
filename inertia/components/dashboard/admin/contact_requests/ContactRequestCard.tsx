import { router } from '@inertiajs/react'
import {
  CONTACT_REQUEST_STATUSES,
  CONTACT_REQUEST_STATUS_LABELS,
  CONTACT_REQUEST_TYPES,
  CONTACT_REQUEST_TYPE_LABELS,
  type ContactRequestStatus,
} from '#shared/constants/contact_request'
import { SUPER_ADMIN_PATHS } from '#shared/constants/super_admin'
import { formatDateTimeFR } from '#shared/helpers/date'
import type { ContactRequestItem } from '#shared/types/contact_request/admin'
import { ContactRequestSenderActions } from '~/components/dashboard/admin/contact_requests/ContactRequestSenderActions'
import Badge, { type BadgeVariant } from '~/components/ui/Badge'
import Button from '~/components/ui/Button'
import Card from '~/components/ui/Card'

interface ContactRequestCardProps {
  request: ContactRequestItem
}

const STATUS_TONES: Record<ContactRequestStatus, BadgeVariant> = {
  [CONTACT_REQUEST_STATUSES.PENDING]: 'warning',
  [CONTACT_REQUEST_STATUSES.TREATED]: 'success',
  [CONTACT_REQUEST_STATUSES.ARCHIVED]: 'neutral',
}

function setStatus(id: number, status: ContactRequestStatus) {
  router.post(SUPER_ADMIN_PATHS.contactRequestStatus(id), { status }, { preserveScroll: true })
}

/** Une demande de la boîte du super admin : coordonnées, message, statut et expéditeur. */
export function ContactRequestCard({ request }: ContactRequestCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{request.name}</p>
          <p className="text-sm text-muted">
            <a
              // eslint-disable-next-line no-restricted-syntax -- lien mailto: (exception documentée)
              href={`mailto:${request.email}`}
              className="text-accent underline-offset-4 hover:underline"
            >
              {request.email}
            </a>
            {request.phone && ` · ${request.phone}`}
            {request.organization && ` · ${request.organization}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={request.type === CONTACT_REQUEST_TYPES.DEMO ? 'info' : 'neutral'}>
            {CONTACT_REQUEST_TYPE_LABELS[request.type]}
          </Badge>
          <Badge variant={STATUS_TONES[request.status]}>
            {CONTACT_REQUEST_STATUS_LABELS[request.status]}
          </Badge>
        </div>
      </div>
      <p className="whitespace-pre-line text-sm text-ink-soft">{request.message}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">{formatDateTimeFR(request.createdAt)}</p>
        <div className="flex gap-2">
          {request.status !== CONTACT_REQUEST_STATUSES.TREATED && (
            <Button
              type="button"
              size="xs"
              onClick={() => setStatus(request.id, CONTACT_REQUEST_STATUSES.TREATED)}
            >
              Marquer comme traitée
            </Button>
          )}
          {request.status !== CONTACT_REQUEST_STATUSES.ARCHIVED && (
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => setStatus(request.id, CONTACT_REQUEST_STATUSES.ARCHIVED)}
            >
              Archiver
            </Button>
          )}
          {request.status !== CONTACT_REQUEST_STATUSES.PENDING && (
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => setStatus(request.id, CONTACT_REQUEST_STATUSES.PENDING)}
            >
              Remettre à traiter
            </Button>
          )}
        </div>
      </div>
      <ContactRequestSenderActions request={request} />
    </Card>
  )
}
