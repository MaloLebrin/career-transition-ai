import { Head } from '@inertiajs/react'
import { formatPrice } from '#shared/helpers/billing/format_price'
import type { SuperAdminHomeStats } from '#shared/types/billing/admin'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import { Eyebrow } from '~/components/ui/Eyebrow'
import StatCard from '~/components/ui/StatCard'

interface SuperAdminHomeProps {
  stats: SuperAdminHomeStats
}

export default function SuperAdminHome({ stats }: SuperAdminHomeProps) {
  return (
    <>
      <Head title="Supervision Plateforme" />
      <DashboardLayout>
        <div className="space-y-10 animate-fade-in">
          <div className="space-y-2">
            <Eyebrow>Vue super admin</Eyebrow>
            <h1 className="font-display text-display-sm text-ink">Supervision de la plateforme</h1>
            <p className="max-w-2xl text-sm text-muted">
              Synthèse globale de l’activité : organisations clientes, utilisateurs connectés au
              portail, particuliers et forfaits.
            </p>
          </div>

          {stats && (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <StatCard label="Organisations actives" value={stats.organizations} color="navy" />
                <StatCard label="Utilisateurs" value={stats.users} color="sage" />
                <StatCard label="Instances" value={1} color="terracotta" />
              </div>
              <section className="space-y-4" aria-labelledby="b2c-stats-title">
                <h2 id="b2c-stats-title" className="text-title-md text-ink">
                  Particuliers (B2C)
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                  <StatCard label="Inscrits" value={stats.b2c.candidates} color="navy" />
                  <StatCard label="Forfaits réglés" value={stats.b2c.paid} color="sage" />
                  <StatCard
                    label="Chiffre d’affaires du mois"
                    value={formatPrice(stats.b2c.monthRevenueCents, stats.b2c.currency)}
                    color="terracotta"
                  />
                  <StatCard
                    label="Demandes d’accompagnement en attente"
                    value={stats.b2c.pendingExpertRequests}
                    color="navy"
                  />
                </div>
              </section>
            </>
          )}
        </div>
      </DashboardLayout>
    </>
  )
}
