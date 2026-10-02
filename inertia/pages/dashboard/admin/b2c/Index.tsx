import { Head } from '@inertiajs/react'
import { formatPrice } from '#shared/helpers/billing/format_price'
import type { B2cCandidateRow, B2cStats } from '#shared/types/billing/admin'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import { B2cCandidatesTable } from '~/components/dashboard/admin/B2cCandidatesTable'
import StatCard from '~/components/ui/StatCard'

interface B2cAdminProps {
  candidates: B2cCandidateRow[]
  stats: B2cStats
}

/** Back-office super admin : particuliers inscrits et indicateurs du forfait (#107). */
export default function B2cAdmin({ candidates, stats }: B2cAdminProps) {
  return (
    <>
      <Head title="Particuliers" />
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h1 className="font-display text-display-sm text-ink">Particuliers</h1>
            <p className="text-sm text-muted">
              Comptes inscrits en libre-service, forfaits réglés et accompagnement. Les listes «
              Organisations » et « Utilisateurs » ne les affichent pas.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <StatCard label="Inscrits" value={stats.candidates} color="navy" />
            <StatCard label="Forfaits réglés" value={stats.paid} color="sage" />
            <StatCard
              label="Chiffre d’affaires du mois"
              value={formatPrice(stats.monthRevenueCents, stats.currency)}
              color="terracotta"
            />
            <StatCard
              label="Demandes d’accompagnement en attente"
              value={stats.pendingExpertRequests}
              color="navy"
            />
          </div>

          <B2cCandidatesTable candidates={candidates} />
        </div>
      </DashboardLayout>
    </>
  )
}
