import { Head, router } from '@inertiajs/react'
import { useEffect } from 'react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import NotesSection from '~/components/dashboard/NotesSection'
import LinkActions from '~/components/ui/LinkActions'
import { useAuth } from '~/hooks/useAuth'
import type { ExerciseResult, SupportPlanStep } from '~/types'
import StepDetailView from '~/components/dashboard/steps/StepDetailView'
import { isUrl } from '#shared/helpers/url'

interface StepDetailProps {
  employeeId: string
  employeeName: string
  step: SupportPlanStep
  results: ExerciseResult[]
}

export default function StepDetail({
  employeeId,
  employeeName,
  step,
  results,
}: StepDetailProps) {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) router.visit('/auth/login')
  }, [user])

  if (!user) {
    return (
      <DashboardLayout selectedEmployeeId={employeeId}>
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="w-8 h-8 border-2 border-brand-sage border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

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
            />
          ) : null
        }
      />
    </DashboardLayout>
  )
}
