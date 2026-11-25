import { Head } from '@inertiajs/react'
import {
  CONTACT_REQUEST_STATUSES,
  CONTACT_REQUEST_STATUS_LABELS,
  CONTACT_REQUEST_TYPES,
  CONTACT_REQUEST_TYPE_LABELS,
  type ContactRequestStatus,
  type ContactRequestType,
} from '#shared/constants/contact_request'
import { SUPER_ADMIN_PATHS } from '#shared/constants/super_admin'
import type { ContactRequestItem } from '#shared/types/contact_request/admin'
import type { PaginationMeta } from '#shared/types/pagination'
import { ContactRequestCard } from '~/components/dashboard/admin/contact_requests/ContactRequestCard'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import AppLink from '~/components/ui/AppLink'
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
              une fois la réponse envoyée, ou bloquez un expéditeur indésirable.{' '}
              <AppLink
                href={SUPER_ADMIN_PATHS.blockedContactEmails}
                className="text-accent underline-offset-4 hover:underline"
              >
                Voir les adresses bloquées
              </AppLink>
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
                  <ContactRequestCard request={request} />
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
