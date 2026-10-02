import { Head, router } from '@inertiajs/react'
import 'react-datepicker/dist/react-datepicker.css'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { ExerciseSaveOverlay } from '../../../components/exercises/ExerciseSaveOverlay'
import SkillMappingTool from '../../../components/exercises/SkillMappingTool'
import AppLink from '../../../components/ui/AppLink'
import Button from '../../../components/ui/Button'
import { EXERCISE_SLUGS } from '../../../config/exercises'
import { useAdvisorExercises } from '../../../hooks/use_advisor_exercises'
import { useAuth } from '../../../hooks/use_auth'
import { useEmployee } from '../../../hooks/use_employee'
import { ExerciseType, type ExerciseDraft } from '../../../types'

interface SkillMappingExerciseProps {
  employeeId?: string
  initialDraftsByType?: Record<string, ExerciseDraft | null>
}

export default function SkillMappingExercise({
  employeeId,
  initialDraftsByType,
}: SkillMappingExerciseProps) {
  const { user } = useAuth()
  const targetId = employeeId || user?.id || '1'
  const { employee: selectedEmployee, refreshEmployee } = useEmployee(targetId)
  const draftsByType = initialDraftsByType ?? {}
  const getInitialDraft = (): ExerciseDraft | null => {
    const slug = EXERCISE_SLUGS[ExerciseType.SKILL_MAPPING]
    return slug ? draftsByType[slug] ?? null : null
  }
  const isCandidat = !employeeId
  const exercisesBasePath = isCandidat
    ? '/dashboard/candidat/exercises'
    : `/dashboard/conseiller/employees/${employeeId}/exercises`
  const backHref = isCandidat ? '/dashboard/candidat' : `/dashboard/conseiller/employees/${employeeId}`

  const { isAnalyzing, isSavingDraft, saveResult, saveDraft } = useAdvisorExercises(
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
      skillMapping: { initialDraft: getInitialDraft() },
      circleOfControl: { initialDraft: null },
    }
  )

  return (
    <>
      <Head title="Exercice Cartographie des compétences" />
      <DashboardLayout selectedEmployeeId={employeeId || null} hideSidebar>
        <div className="animate-fadeIn max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <AppLink href={backHref}>
              <Button variant="ghost" size="sm">
                ← Retour
              </Button>
            </AppLink>
            {isSavingDraft && (
              <div className="flex items-center space-x-2 text-slate-400">
                <div className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest italic">
                  Sauvegarde auto...
                </span>
              </div>
            )}
          </div>
          <ExerciseSaveOverlay open={isAnalyzing} />
          <div className="w-full">
            <SkillMappingTool
              onSave={(data, duration) =>
                saveResult(ExerciseType.SKILL_MAPPING, data, 10, duration)
              }
              onSaveDraft={(data) => saveDraft(ExerciseType.SKILL_MAPPING, data)}
              initialDraftPromise={Promise.resolve(getInitialDraft())}
              experiences={selectedEmployee?.experiences || []}
            />
          </div>
        </div>
      </DashboardLayout>
    </>
  )
}
