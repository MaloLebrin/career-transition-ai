import { Head } from '@inertiajs/react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import StepDetailView from '~/components/dashboard/steps/StepDetailView'
import type { ExerciseResult, SupportPlanStep } from '~/types'
import { formatSessionDate } from '../../../../shared/helpers/date'

interface StepDetailProps {
  step: SupportPlanStep
  results: ExerciseResult[]
}

export default function StepDetail({ step, results }: StepDetailProps) {
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
        exerciseLinksEnabled
      />
    </DashboardLayout>
  )
}
