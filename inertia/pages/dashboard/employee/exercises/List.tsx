import { useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLink from '~/components/ui/AppLink'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import Card from '~/components/ui/Card'
import { useAuth } from '~/hooks/useAuth'
import type { ExerciseListEntry } from '~/config/exercises'

interface CandidatExerciseListProps {
  exercises: ExerciseListEntry[]
}

export default function CandidatExerciseList({ exercises = [] }: CandidatExerciseListProps) {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) router.visit('/auth/login')
  }, [user])

  if (!user) return null

  return (
    <DashboardLayout>
      <Head title="Exercices" />
      <div className="space-y-8 animate-fadeIn">
        <div className="flex items-center gap-4">
          <AppLink href="/dashboard/candidat" className="text-brand-navy/70 hover:text-brand-navy">
            ← Retour
          </AppLink>
        </div>
        <h1 className="text-3xl font-bold text-brand-navy">Tous les exercices</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((ex) => (
            <AppLink key={ex.slug} href={`/dashboard/candidat/exercises/${ex.slug}`}>
              <Card className="p-6 h-full hover:border-brand-sage/30 transition-colors cursor-pointer">
                <h3 className="text-lg font-semibold text-brand-navy mb-2">{ex.title}</h3>
                <p className="text-brand-navy/70 text-sm">{ex.description}</p>
              </Card>
            </AppLink>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
