import { Head } from '@inertiajs/react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import AppLink from '~/components/ui/AppLink'
import Card from '~/components/ui/Card'
import type { ExerciseListEntry } from '~/config/exercises'

interface CandidatExerciseListProps {
  exercises: ExerciseListEntry[]
  unlockedExerciseSlugs?: string[]
  completedExerciseSlugs?: string[]
}

export default function CandidatExerciseList({
  exercises = [],
  unlockedExerciseSlugs = [],
  completedExerciseSlugs = [],
}: CandidatExerciseListProps) {
  const unlockedSet = new Set(unlockedExerciseSlugs)
  const completedSet = new Set(completedExerciseSlugs)

  return (
    <DashboardLayout hideSidebar>
      <Head title="Exercices" />
      <div className="space-y-8 animate-fadeIn">
        <div className="flex items-center gap-4">
          <AppLink href="/dashboard/candidat" className="text-brand-navy/70 hover:text-brand-navy">
            ← Retour
          </AppLink>
        </div>
        <h1 className="text-3xl font-bold text-brand-navy">Tous les exercices</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((ex) => {
            const isUnlocked = unlockedSet.has(ex.slug)

            if (!isUnlocked) {
              return (
                <Card
                  key={ex.slug}
                  className="p-6 h-full border-brand-navy/10 bg-brand-ivory/20 opacity-60 cursor-not-allowed"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-brand-navy">{ex.title}</h3>
                    <span className="text-[9px] font-bold uppercase tracking-wide rounded-full bg-amber-100 text-amber-600 px-2 py-0.5">
                      Verrouillé
                    </span>
                  </div>
                  <p className="text-brand-navy/60 text-sm">{ex.description}</p>
                </Card>
              )
            }

            return (
              <AppLink key={ex.slug} href={`/dashboard/candidat/exercises/${ex.slug}`}>
                <Card className="p-6 h-full hover:border-brand-sage/30 transition-colors cursor-pointer">
                  <h3 className="text-lg font-semibold text-brand-navy mb-2">{ex.title}</h3>
                  <p className="text-brand-navy/70 text-sm">{ex.description}</p>
                  {completedSet.has(ex.slug) && (
                    <span className="mt-4 block text-[9px] font-bold uppercase tracking-wide rounded-full bg-sage-100 text-sage-700 px-2 py-0.5">
                      Complété
                    </span>
                  )}
                </Card>
              </AppLink>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
