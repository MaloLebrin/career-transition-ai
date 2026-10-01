import { Head } from '@inertiajs/react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import StatCard from '~/components/ui/StatCard'

interface SuperAdminHomeProps {
  stats: {
    organizations: number
    users: number
  }
}

export default function SuperAdminHome({ stats }: SuperAdminHomeProps) {
  return (
    <>
      <Head title="Supervision Plateforme" />
      <DashboardLayout>
        <div className="space-y-10 animate-fadeIn">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.25em]">
              Vue Super Admin
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-brand-navy tracking-tight">
              Supervision de la plateforme
            </h1>
            <p className="text-brand-navy/60 text-sm font-medium max-w-2xl">
              Synthèse globale de l’activité : organisations clientes, utilisateurs connectés au
              portail.
            </p>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Organisations actives" value={stats.organizations} color="navy" />
              <StatCard label="Utilisateurs" value={stats.users} color="sage" />
              <StatCard label="Instances" value={1} color="terracotta" />
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  )
}
