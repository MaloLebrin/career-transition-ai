import { Head, router } from '@inertiajs/react'
import { useEffect } from 'react'
import 'react-datepicker/dist/react-datepicker.css'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import TargetingTool from '~/components/exercises/TargetingTool'
import AppLink from '~/components/ui/AppLink'
import Button from '~/components/ui/Button'
import { useAdvisorExercises } from '~/hooks/use_advisor_exercises'
import { useAuth } from '~/hooks/use_auth'
import { useEmployee } from '~/hooks/use_employee'
import { ExerciseType } from '~/types'

interface TargetingExerciseProps {
  employeeId?: string
  initialDraftsByType?: Record<string, unknown>
}

export default function TargetingExercise({
  employeeId,
}: TargetingExerciseProps) {
  const { user } = useAuth()
  const targetId = employeeId || user?.id || '1'
  const { employee: selectedEmployee, refreshEmployee } = useEmployee(targetId)
  const isCandidat = !employeeId
  const exercisesBasePath = isCandidat
    ? '/dashboard/candidat/exercises'
    : `/dashboard/conseiller/employees/${employeeId}/exercises`
  const backHref = isCandidat ? '/dashboard/candidat' : `/dashboard/conseiller/employees/${employeeId}`

  const { isAnalyzing, saveResult } = useAdvisorExercises(
    selectedEmployee,
    async () => {
      await refreshEmployee()
      router.visit(backHref)
    },
    {
      exercisesBasePath,
      motivation: { initialDraft: null },
      values: { initialDraft: null },
      personality: { initialDraft: null },
      lifeCurve: { initialDraft: null },
      targeting: { initialDraft: null },
      disc: { initialDraft: null },
      skillMapping: { initialDraft: null },
      circleOfControl: { initialDraft: null },
    }
  )

  useEffect(() => {
    if (!user) router.visit('/auth/login')
  }, [user])

  if (!user) {
    return (
      <DashboardLayout selectedEmployeeId={employeeId || null} hideSidebar>
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="w-8 h-8 border-2 border-brand-sage border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <>
      <Head title="Exercice Ciblage" />
      <DashboardLayout selectedEmployeeId={employeeId || null} hideSidebar>
        <div className="animate-fadeIn max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <AppLink href={backHref}>
              <Button variant="ghost" size="sm">
                ← Retour
              </Button>
            </AppLink>
          </div>
          {isAnalyzing && (
            <div className="fixed inset-0 bg-brand-ivory/95 backdrop-blur-3xl z-100 flex flex-col items-center justify-center">
              <div className="w-24 h-24 border-4 border-brand-sage border-t-transparent rounded-full animate-spin mb-10" />
              <h3 className="text-3xl font-bold text-brand-navy tracking-tight text-center">
                IA en action...
                <br />
                <span className="text-sm font-bold text-brand-navy/40">
                  Gemini décode votre profil vitaminé
                </span>
              </h3>
            </div>
          )}
          <div className="w-full">
            <TargetingTool
              onSave={(data, duration) => saveResult(ExerciseType.TARGETING, data, 10, duration)}
              employeeProfile={
                selectedEmployee
                  ? {
                      skills: selectedEmployee.skills.map((s) => s.name),
                      targetRole: selectedEmployee.targetRole || '',
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </DashboardLayout>
    </>
  )
}
