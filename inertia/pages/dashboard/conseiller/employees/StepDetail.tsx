import { isUrl } from '#shared/helpers/url'
import { Head } from '@inertiajs/react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import NotesSection from '~/components/dashboard/NotesSection'
import StepDetailView from '~/components/dashboard/steps/StepDetailView'
import LinkActions from '~/components/ui/LinkActions'
import type { ExerciseResult, SupportPlanStep } from '~/types'
import type { Note } from '~/types/note'

interface StepDetailProps {
  employeeId: string
  employeeName: string
  step: SupportPlanStep
  results: ExerciseResult[]
  notes?: Note[]
}

export default function StepDetail({
  employeeId,
  employeeName,
  step,
  results,
  notes = [],
}: StepDetailProps) {
  const stepNumber = (step.sortOrder ?? 0) + 1
  const stepTitle = `RDV ${stepNumber}`

  const breadcrumbItems = [
    { label: 'Tableau de bord', href: '/dashboard/conseiller' },
    { label: employeeName, href: `/dashboard/conseiller/employees/${employeeId}` },
    { label: 'Feuille de route' },
    { label: stepTitle },
  ]

  return (
    <DashboardLayout selectedEmployeeId={employeeId}>
      <Head title={`${stepTitle} - ${employeeName}`} />
      <StepDetailView
        breadcrumbItems={breadcrumbItems}
        stepTitle={stepTitle}
        step={step}
        results={results}
        headerMeta={
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
            Dossier #{String(step.id).slice(0, 8)}
          </span>
        }
        locationOrLinkActions={
          step.locationOrLink && isUrl(step.locationOrLink) ? (
            <LinkActions value={step.locationOrLink} />
          ) : null
        }
        afterSidebarCard={
          results.length > 0 ? (
            <NotesSection
              employeeId={Number(employeeId)}
              context="exercise"
              exerciseResultId={results[0].id}
              title="Notes sur cet exercice"
              isAdvisor={true}
              initialNotes={notes}
            />
          ) : null
        }
      />
    </DashboardLayout>
  )
}
