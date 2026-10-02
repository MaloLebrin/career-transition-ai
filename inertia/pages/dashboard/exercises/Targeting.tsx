import { Head, router } from '@inertiajs/react'
import 'react-datepicker/dist/react-datepicker.css'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { ExerciseSaveOverlay } from '../../../components/exercises/ExerciseSaveOverlay'
import TargetingTool from '../../../components/exercises/TargetingTool'
import AppLink from '../../../components/ui/AppLink'
import Button from '../../../components/ui/Button'
import { useAdvisorExercises } from '../../../hooks/use_advisor_exercises'
import { useAuth } from '../../../hooks/use_auth'
import { useEmployee } from '../../../hooks/use_employee'
import { ExerciseType } from '../../../types'

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
          <ExerciseSaveOverlay open={isAnalyzing} />
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
