import { Head, router } from '@inertiajs/react'
import {
  CONTACT_REQUEST_STATUSES,
  CONTACT_REQUEST_STATUS_LABELS,
  CONTACT_REQUEST_TYPES,
  CONTACT_REQUEST_TYPE_LABELS,
  type ContactRequestStatus,
  type ContactRequestType,
} from '#shared/constants/contact_request'
import { SUPER_ADMIN_PATHS } from '#shared/constants/super_admin'
import { formatDateTimeFR } from '#shared/helpers/date'
import type { ContactRequestItem } from '#shared/types/contact_request/admin'
import type { PaginationMeta } from '#shared/types/pagination'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import Badge, { type BadgeVariant } from '~/components/ui/Badge'
import Button from '~/components/ui/Button'
import Card from '~/components/ui/Card'
import Input from '~/components/ui/Input'
import { Pagination } from '~/components/ui/Pagination'
import SelectField, { type SelectFieldOption } from '~/components/ui/SelectField'
import { useServerList } from '~/hooks/use_server_list'

interface ContactRequestsProps {
  requests: ContactRequestItem[]
  pagination: PaginationMeta
  filters: {
    search: string
    status: ContactRequestStatus | 'all'
    type: ContactRequestType | 'all'
  }
}

const LIST_ONLY = ['requests']

const STATUS_OPTIONS: SelectFieldOption<ContactRequestStatus | 'all'>[] = [
  { value: 'all', label: 'Tous les statuts' },
  ...Object.values(CONTACT_REQUEST_STATUSES).map((status) => ({
    value: status,
    label: CONTACT_REQUEST_STATUS_LABELS[status],
  })),
]

const TYPE_OPTIONS: SelectFieldOption<ContactRequestType | 'all'>[] = [
  { value: 'all', label: 'Tous les types' },
  ...Object.values(CONTACT_REQUEST_TYPES).map((type) => ({
    value: type,
    label: CONTACT_REQUEST_TYPE_LABELS[type],
  })),
]

const STATUS_TONES: Record<ContactRequestStatus, BadgeVariant> = {
  [CONTACT_REQUEST_STATUSES.PENDING]: 'warning',
  [CONTACT_REQUEST_STATUSES.TREATED]: 'success',
  [CONTACT_REQUEST_STATUSES.ARCHIVED]: 'neutral',
}

function setStatus(id: number, status: ContactRequestStatus) {
  router.post(SUPER_ADMIN_PATHS.contactRequestStatus(id), { status }, { preserveScroll: true })
}

/** Boîte des demandes de contact et de démo du site public (#73). */
export default function ContactRequestsAdmin({
  requests,
  pagination,
  filters,
}: ContactRequestsProps) {
  const { values, setSearch, setFilter, goToPage } = useServerList(
    SUPER_ADMIN_PATHS.contactRequests,
    { search: filters.search, status: filters.status, type: filters.type },
    LIST_ONLY
  )
  const hasFilters = filters.search !== '' || filters.status !== 'all' || filters.type !== 'all'

  return (
    <>
      <Head title="Demandes de contact" />
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h1 className="font-display text-display-sm text-ink">Demandes de contact</h1>
            <p className="text-sm text-muted">
              Messages et demandes de démo envoyés depuis le site public. Marquez-les comme traitées
              une fois la réponse envoyée.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              type="search"
              aria-label="Rechercher une demande"
              placeholder="Rechercher par nom, e-mail ou organisation…"
              value={values.search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <SelectField<ContactRequestStatus | 'all'>
              aria-label="Filtrer par statut"
              options={STATUS_OPTIONS}
              value={values.status as ContactRequestStatus | 'all'}
              onChange={(v) => setFilter('status', v)}
              className="shrink-0 md:w-52"
            />
            <SelectField<ContactRequestType | 'all'>
              aria-label="Filtrer par type"
              options={TYPE_OPTIONS}
              value={values.type as ContactRequestType | 'all'}
              onChange={(v) => setFilter('type', v)}
              className="shrink-0 md:w-44"
            />
          </div>

          {requests.length === 0 ? (
            <Card variant="flat" role="status">
              <p className="text-sm text-muted">
                {hasFilters
                  ? 'Aucune demande ne correspond à ces critères.'
                  : 'Aucune demande de contact pour le moment.'}
              </p>
            </Card>
          ) : (
            <ul className="space-y-4" aria-label="Demandes de contact">
              {requests.map((request) => (
                <li key={request.id}>
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
                        <Badge
                          variant={request.type === CONTACT_REQUEST_TYPES.DEMO ? 'info' : 'neutral'}
                        >
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
                  </Card>
                </li>
              ))}
            </ul>
          )}

          <Pagination
            page={pagination.page}
            lastPage={pagination.lastPage}
            onPageChange={goToPage}
          />
        </div>
      </DashboardLayout>
    </>
  )
}
