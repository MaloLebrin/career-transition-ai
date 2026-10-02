import { Head } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import {
  EXPERT_REQUEST_STATUS_LABELS,
  EXPERT_REQUEST_STATUSES,
  type ExpertRequestStatus,
  expertRequestStatusValues,
} from '#shared/constants/expert_request'
import type { AdminExpertRequestRow, PlatformTeamMember } from '#shared/types/expert_request/admin'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import { ExpertRequestRow } from '~/components/dashboard/admin/ExpertRequestRow'
import Card from '~/components/ui/Card'
import SelectField, { type SelectFieldOption } from '~/components/ui/SelectField'

interface ExpertRequestsAdminProps {
  requests: AdminExpertRequestRow[]
  experts: PlatformTeamMember[]
}

type StatusFilter = ExpertRequestStatus | 'all'

const FILTER_OPTIONS: SelectFieldOption<StatusFilter>[] = [
  { value: 'all', label: 'Tous les statuts' },
  ...expertRequestStatusValues.map((status) => ({
    value: status,
    label: EXPERT_REQUEST_STATUS_LABELS[status],
  })),
]

/** Back-office super admin : demandes d'accompagnement des particuliers (#105). */
export default function ExpertRequestsAdmin({ requests, experts }: ExpertRequestsAdminProps) {
  const [status, setStatus] = useState<StatusFilter>('all')
  const pendingCount = requests.filter((r) => r.status === EXPERT_REQUEST_STATUSES.PENDING).length
  const visible = useMemo(
    () => (status === 'all' ? requests : requests.filter((r) => r.status === status)),
    [requests, status]
  )

  return (
    <>
      <Head title="Demandes d'accompagnement" />
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <h1 className="font-display text-display-sm text-ink">Demandes d’accompagnement</h1>
              <p className="text-sm text-muted">
                {pendingCount} en attente · {requests.length} au total. Assignez un expert interne
                ou refusez avec un motif.
              </p>
            </div>
            <SelectField
              aria-label="Filtrer par statut"
              className="md:w-64"
              options={FILTER_OPTIONS}
              value={status}
              onChange={setStatus}
            />
          </div>

          {visible.length === 0 ? (
            <Card variant="flat" role="status">
              <p className="text-sm text-muted">Aucune demande pour ce filtre.</p>
            </Card>
          ) : (
            <ul className="space-y-4" aria-label="Demandes d’accompagnement">
              {visible.map((request) => (
                <ExpertRequestRow key={request.id} request={request} experts={experts} />
              ))}
            </ul>
          )}
        </div>
      </DashboardLayout>
    </>
  )
}
