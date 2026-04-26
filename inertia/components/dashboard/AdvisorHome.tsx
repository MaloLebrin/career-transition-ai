import { useState } from 'react'
import { useEmployees } from '../../hooks/use_employees'
import { formatDateTimeFR } from '#shared/helpers/date'
import AddEmployeeModal from '../modals/AddEmployeeModal'
import Button from '../ui/Button'
import Card from '../ui/Card'
import StatCard from '../ui/StatCard'

export default function AdvisorHome() {
  const { employees } = useEmployees('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-brand-navy">Activité Globale</h2>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          size="md"
          variant="secondary"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M12 4v16m8-8H4"
              />
            </svg>
          }
        >
          Nouveau Candidat
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total suivis" value={employees?.length ?? 0} color="navy" />
        <StatCard
          label="En attente"
          value={employees?.filter((e) => !e.onboarded).length ?? 0}
          color="terracotta"
        />
        <StatCard
          label="Étapes validées"
          value={employees?.reduce((acc, e) => acc + (e.exercises?.length ?? 0), 0) ?? 0}
          color="sage"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8">
          <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest mb-6 pb-3 border-b border-brand-sage/20">
            Dernières Activités
          </h3>
          <div className="space-y-4">
            {(employees ?? [])
              .flatMap((e) =>
                (e.exercises ?? [])
                  .filter((ex) => ex.date !== null)
                  .map((ex) => ({ ...ex, employeeName: e.name, employeeId: e.id }))
              )
              .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
              .slice(0, 5)
              .map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-2xl bg-brand-ivory/50 border border-brand-navy/5"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-sage/10 text-brand-sage shadow-sm shadow-brand-sage/15 flex items-center justify-center font-bold text-xs">
                      {activity.employeeName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-navy">{activity.employeeName}</p>
                      <p className="text-[10px] font-medium text-brand-navy/60">{activity.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-brand-sage uppercase tracking-widest">
                      {new Date(activity.date!).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            {(employees ?? []).reduce((acc, e) => acc + (e.exercises ?? []).filter((ex) => ex.date !== null).length, 0) === 0 && (
              <p className="text-center py-8 text-brand-navy/40 text-xs font-medium italic">
                Aucune activité récente
              </p>
            )}
          </div>
        </Card>

        <Card className="p-8">
          <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest mb-6 pb-3 border-b border-brand-sage/20">
            Prochains Rendez-vous
          </h3>
          <div className="space-y-4">
            {(() => {
              const now = new Date()
              const upcomingSteps = (employees ?? [])
                .flatMap((e) =>
                  (e.plan ?? [])
                    .filter((step) => step.scheduledAt && new Date(step.scheduledAt) > now && step.status === 'scheduled')
                    .map((step) => ({ ...step, employeeName: e.name, employeeId: e.id }))
                )
                .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
                .slice(0, 5)
              
              return upcomingSteps.length > 0 ? (
                upcomingSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-2xl bg-brand-terracotta/5 border border-brand-terracotta/10"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-terracotta/10 text-brand-terracotta flex items-center justify-center">
                        <svg
                          className="w-5 h-5 stroke-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-navy">{step.employeeName}</p>
                        <p className="text-[10px] font-medium text-brand-navy/60">
                          RDV {(step.sortOrder ?? 0) + 1}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-brand-terracotta uppercase tracking-widest">
                        {formatDateTimeFR(step.scheduledAt!)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-brand-navy/40 text-xs font-medium italic">
                  Aucun rendez-vous planifié
                </p>
              )
            })()}
          </div>
        </Card>
      </div>

      {isAddModalOpen && <AddEmployeeModal onClose={() => setIsAddModalOpen(false)} />}
    </div>
  )
}
