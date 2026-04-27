import type { AdvisorHomeStats } from '~/types/Employee';
import StatCard from '../../../../ui/StatCard';

export function StatsRow({ stats }: { stats: AdvisorHomeStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <StatCard label="Actifs" value={stats.totalActive} color="navy" />
      <StatCard
        label="En attente d'onboarding"
        value={stats.pendingOnboarding}
        color="terracotta"
      />
      <StatCard label="Prochains RDV" value={stats.upcomingCount} color="sage" />
      <StatCard label="Étapes ce mois-ci" value={stats.completedStepsThisMonth} color="sage" />
    </div>
  )
}
