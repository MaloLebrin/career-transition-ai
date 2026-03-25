import { Head } from '@inertiajs/react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import AppLink from '~/components/ui/AppLink'
import Card from '~/components/ui/Card'

export interface ExerciseListItem {
  slug: string
  title: string
  description: string
}

export interface ExerciseResultListItem {
  slug: string
  title: string
  date: string
  status: string
}

type Props =
  | {
      context: 'candidat'
      exercises: ExerciseListItem[]
      results?: never
      employeeId?: never
    }
  | {
      context: 'conseiller'
      results: ExerciseResultListItem[]
      employeeId: string
      exercises?: never
    }

function formatResultDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ExerciseList(props: Props) {
  const isCandidat = props.context === 'candidat'

  const title = isCandidat ? 'Tous les exercices' : 'Résultats des exercices'
  const backHref = isCandidat ? '/dashboard/candidat' : `/dashboard/conseiller/employees/${props.employeeId}`

  return (
    <DashboardLayout hideSidebar={!isCandidat}>
      <Head title={title} />
      <div className="space-y-8 animate-fadeIn">
        <div className="flex items-center gap-4">
          <AppLink href={backHref} className="text-brand-navy/70 hover:text-brand-navy">
            ← Retour
          </AppLink>
        </div>

        <h1 className="text-3xl font-bold text-brand-navy">{title}</h1>

        {isCandidat ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {props.exercises.map((e) => (
              <AppLink key={e.slug} href={`/dashboard/candidat/exercises/${e.slug}`}>
                <Card className="p-6 h-full hover:border-brand-sage/30 transition-colors cursor-pointer">
                  <h3 className="text-lg font-semibold text-brand-navy mb-2">{e.title}</h3>
                  <p className="text-brand-navy/60 text-sm">{e.description}</p>
                </Card>
              </AppLink>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {props.results.length === 0 ? (
              <p className="text-brand-navy/60 col-span-full">
                Aucun exercice réalisé pour l&apos;instant.
              </p>
            ) : (
              props.results.map((r) => (
                <AppLink
                  key={r.slug}
                  href={`/dashboard/conseiller/employees/${props.employeeId}/exercises/results/${r.slug}`}
                >
                  <Card className="p-6 h-full hover:border-brand-sage/30 transition-colors cursor-pointer">
                    <h3 className="text-lg font-semibold text-brand-navy mb-2">{r.title}</h3>
                    <p className="text-brand-navy/60 text-sm">
                      {r.status === 'completed' ? 'Complété' : 'Brouillon'} le{' '}
                      {formatResultDate(r.date)}
                    </p>
                  </Card>
                </AppLink>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

