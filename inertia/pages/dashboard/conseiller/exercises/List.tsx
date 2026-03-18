import { useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLink from '~/components/ui/AppLink'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import Card from '~/components/ui/Card'
import { useAuth } from '~/hooks/useAuth'

export interface ExerciseResultListItem {
  slug: string
  title: string
  date: string
  status: string
}

interface ConseillerExerciseListProps {
  results: ExerciseResultListItem[]
  employeeId: string
}

function formatResultDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ConseillerExerciseList({
  results = [],
  employeeId,
}: ConseillerExerciseListProps) {
  const { user } = useAuth()
  const basePath = `/dashboard/conseiller/employees/${employeeId}/exercise-results`

  useEffect(() => {
    if (!user) router.visit('/auth/login')
  }, [user])

  if (!user) return null

  return (
    <DashboardLayout selectedEmployeeId={employeeId} hideSidebar>
      <Head title="Résultats des exercices" />
      <div className="space-y-8 animate-fadeIn">
        <div className="flex items-center gap-4">
          <AppLink
            href={`/dashboard/conseiller/employees/${employeeId}`}
            className="text-brand-navy/70 hover:text-brand-navy"
          >
            ← Retour
          </AppLink>
        </div>
        <h1 className="text-3xl font-bold text-brand-navy">Résultats des exercices</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.length === 0 ? (
            <p className="text-brand-navy/60 col-span-full">
              Aucun exercice réalisé pour l&apos;instant.
            </p>
          ) : (
            results.map((r) => (
              <AppLink key={r.slug} href={`${basePath}/${r.slug}`}>
                <Card className="p-6 h-full hover:border-brand-sage/30 transition-colors cursor-pointer">
                  <h3 className="text-lg font-semibold text-brand-navy mb-2">{r.title}</h3>
                  <p className="text-brand-navy/60 text-sm">
                    {r.status === 'completed' ? 'Complété' : 'Brouillon'} le {formatResultDate(r.date)}
                  </p>
                </Card>
              </AppLink>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
