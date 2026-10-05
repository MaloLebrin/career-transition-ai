import { EmployeeData } from '../../types/employee'
import AppLink from '../ui/AppLink'
import Button from '../ui/Button'
import Card from '../ui/Card'
import PlanStepsTimeline from './PlanStepsTimeline'

export default function EmployeeHome({
  employee,
  completedExercises,
  totalExercises,
  exerciseCompletionPercent,
  exerciseProgressByType: _exerciseProgressByType,
}: {
  employee: EmployeeData
  completedExercises: number
  totalExercises: number
  exerciseCompletionPercent: number
  exerciseProgressByType: Record<string, number>
}) {
  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-2 border-brand-sage border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fadeIn w-full">
      <div className="bg-brand-navy p-10 md:p-14 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-sage/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-brand-terracotta/8 rounded-full -ml-20 -mb-20 blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Hello, {employee.name.split(' ')[0]} 🚀
          </h2>
          <p className="text-white/60 text-lg opacity-90 max-w-xl">
            Votre transition vers{' '}
            <span className="text-white font-bold">{employee.targetRole}</span> est boostée à l'IA.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <AppLink href="/dashboard/candidat/profile">
              <Button variant="outline" className="bg-white text-brand-navy border-none" size="lg">
                Mon Profil Vitaminé
              </Button>
            </AppLink>
            <AppLink href="/dashboard/candidat/synthesis">
              <Button variant="outline" className="border-white/30 text-white" size="lg">
                Ma synthèse
              </Button>
            </AppLink>
            <AppLink href="/dashboard/candidat/chat">
              <Button variant="outline" className="border-white/30 text-white" size="lg">
                Discuter avec un expert
              </Button>
            </AppLink>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card className="p-10">
            <div className="mb-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-[0.2em]">
                  Ma Feuille de Route
                </h3>
                <span className="text-xs font-bold text-brand-sage uppercase tracking-[0.15em]">
                  Progression exercices: {exerciseCompletionPercent}% ({completedExercises}/
                  {totalExercises})
                </span>
              </div>
              <div
                className="h-2 w-full rounded-full bg-brand-navy/10 overflow-hidden"
                aria-label="Progression des exercices"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={exerciseCompletionPercent}
              >
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${exerciseCompletionPercent}%` }}
                />
              </div>
            </div>
            <PlanStepsTimeline plan={employee.plan} exercises={employee.exercises ?? []} />
            <div className="mt-8 pt-8 border-t border-brand-navy/5">
              <AppLink
                href="/dashboard/candidat/exercises"
                className="text-brand-sage font-semibold text-sm hover:underline"
              >
                Voir tous les exercices →
              </AppLink>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-4 space-y-8">
          <Card className="p-8">
            <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest mb-6">
              Expertises
            </h3>
            <div className="space-y-4">
              {employee.skills.slice(0, 5).map((s, i) => (
                <div key={i} className="space-y-1.5 pl-3 border-l-2 border-brand-sage/30">
                  <div className="flex justify-between text-[10px] font-bold text-brand-navy/60 uppercase">
                    <span>{s.name}</span>
                    <span className="text-brand-sage">{s.level}/5</span>
                  </div>
                  <div className="h-1.5 bg-brand-navy/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(s.level / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
