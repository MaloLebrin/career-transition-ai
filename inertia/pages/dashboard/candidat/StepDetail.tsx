import { useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import { useAuth } from '~/hooks/useAuth'
import type { ExerciseResult, SupportPlanStep } from '~/types'
import StepDetailView from '~/components/dashboard/steps/StepDetailView'

interface StepDetailProps {
  step: SupportPlanStep
  results: ExerciseResult[]
}

function formatSessionDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function StepDetail({ step, results }: StepDetailProps) {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) router.visit('/auth/login')
  }, [user])

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="w-8 h-8 border-2 border-brand-sage border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  const stepNumber = (step.sortOrder ?? 0) + 1
  const stepTitle = `RDV ${stepNumber}`

  const breadcrumbItems = [
    { label: 'Mon espace', href: '/dashboard/candidat' },
    { label: 'Ma feuille de route' },
    { label: stepTitle },
  ]

  return (
    <DashboardLayout>
      <Head title={stepTitle} />
      <StepDetailView
        breadcrumbItems={breadcrumbItems}
        stepTitle={stepTitle}
        step={step}
        results={results}
        sidebarExtras={
          <>
            {results.length > 0 && results[0].date && (
              <div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Passage le
                </div>
                <div className="text-base font-black text-slate-900">
                  {formatSessionDate(results[0].date)}
                </div>
              </div>
            )}
            {results.length > 0 && results[0].duration && (
              <div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Durée totale
                </div>
                <div className="text-base font-black text-slate-900">
                  {Math.floor(results[0].duration / 60)} min {results[0].duration % 60} s
                </div>
              </div>
            )}
          </>
        }
      />
    </DashboardLayout>
  )
}
