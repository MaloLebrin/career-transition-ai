import { Head, router } from '@inertiajs/react'
import 'react-datepicker/dist/react-datepicker.css'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import CircleOfControlTool from '~/components/exercises/CircleOfControlTool'
import DISCTool from '~/components/exercises/DISCTool'
import { ExerciseSaveOverlay } from '~/components/exercises/ExerciseSaveOverlay'
import LifeCurveTool from '~/components/exercises/LifeCurveTool'
import MotivationTool from '~/components/exercises/MotivationTool'
import PersonalityTool from '~/components/exercises/PersonalityTool'
import SkillMappingTool from '~/components/exercises/SkillMappingTool'
import TargetingTool from '~/components/exercises/TargetingTool'
import ValuesTool from '~/components/exercises/ValuesTool'
import AppLink from '~/components/ui/AppLink'
import Button from '~/components/ui/Button'
import { EXERCISE_SLUGS } from '~/config/exercises'
import { useAdvisorExercises } from '~/hooks/use_advisor_exercises'
import { useEmployee } from '~/hooks/use_employee'
import { ExerciseType, type ExerciseDraft } from '~/types'
import type { Employee } from '~/types/employee'

interface ConseillerExerciseProps {
  type: string
  employeeId: string
  employee: Employee
  initialDraftsByType?: Record<string, ExerciseDraft | null>
}

const EXERCISE_TYPES: Record<string, ExerciseType> = {
  MOTIVATION: ExerciseType.MOTIVATION,
  VALUES: ExerciseType.VALUES,
  PERSONALITY: ExerciseType.PERSONALITY,
  LIFE_CURVE: ExerciseType.LIFE_CURVE,
  TARGETING: ExerciseType.TARGETING,
  DISC: ExerciseType.DISC,
  SKILL_MAPPING: ExerciseType.SKILL_MAPPING,
  CIRCLE_OF_CONTROL: ExerciseType.CIRCLE_OF_CONTROL,
}

export default function ConseillerExercise({
  type,
  employeeId,
  employee,
  initialDraftsByType,
}: ConseillerExerciseProps) {
  const { employee: selectedEmployee, refreshEmployee } = useEmployee(employeeId, employee)

  const draftsByType = initialDraftsByType ?? {}
  const getInitialDraft = (exerciseType: ExerciseType): ExerciseDraft | null => {
    const slug = EXERCISE_SLUGS[exerciseType]
    return slug ? draftsByType[slug] ?? null : null
  }

  const backHref = `/dashboard/conseiller/employees/${employeeId}`
  const exercisesBasePath = `${backHref}/exercises`

  const { isAnalyzing, isSavingDraft, saveResult, saveDraft } = useAdvisorExercises(
    selectedEmployee,
    async () => {
      await refreshEmployee()
      router.visit(backHref)
    },
    {
      exercisesBasePath,
      motivation: { initialDraft: getInitialDraft(ExerciseType.MOTIVATION) },
      values: { initialDraft: getInitialDraft(ExerciseType.VALUES) },
      personality: { initialDraft: getInitialDraft(ExerciseType.PERSONALITY) },
      lifeCurve: { initialDraft: getInitialDraft(ExerciseType.LIFE_CURVE) },
      targeting: { initialDraft: getInitialDraft(ExerciseType.TARGETING) },
      disc: { initialDraft: getInitialDraft(ExerciseType.DISC) },
      skillMapping: { initialDraft: getInitialDraft(ExerciseType.SKILL_MAPPING) },
      circleOfControl: { initialDraft: getInitialDraft(ExerciseType.CIRCLE_OF_CONTROL) },
    }
  )

  const exerciseType =
    EXERCISE_TYPES[type.toUpperCase()] ?? null

  return (
    <>
      <Head title={`Exercice ${type}`} />
      <DashboardLayout selectedEmployeeId={employeeId} hideSidebar>
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
            {exerciseType === ExerciseType.MOTIVATION && (
              <MotivationTool
                onSave={(data, duration) => saveResult(ExerciseType.MOTIVATION, data, 10, duration)}
                onSaveDraft={(data) => saveDraft(ExerciseType.MOTIVATION, data)}
                initialDraftPromise={Promise.resolve(getInitialDraft(ExerciseType.MOTIVATION))}
              />
            )}
            {exerciseType === ExerciseType.VALUES && (
              <ValuesTool
                onSave={(data, duration) => saveResult(ExerciseType.VALUES, data, 10, duration)}
                onSaveDraft={(data) => saveDraft(ExerciseType.VALUES, data)}
                initialDraftPromise={Promise.resolve(getInitialDraft(ExerciseType.VALUES))}
              />
            )}
            {exerciseType === ExerciseType.LIFE_CURVE && (
              <LifeCurveTool
                onSave={(data, duration) => saveResult(ExerciseType.LIFE_CURVE, data, 10, duration)}
                onSaveDraft={(data) => saveDraft(ExerciseType.LIFE_CURVE, data)}
                initialDraftPromise={Promise.resolve(getInitialDraft(ExerciseType.LIFE_CURVE))}
              />
            )}
            {exerciseType === ExerciseType.PERSONALITY && (
              <PersonalityTool
                onSave={(data, duration) =>
                  saveResult(ExerciseType.PERSONALITY, data, 10, duration)
                }
              />
            )}
            {exerciseType === ExerciseType.TARGETING && (
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
            )}
            {exerciseType === ExerciseType.DISC && (
              <DISCTool
                onSave={(data, duration) => saveResult(ExerciseType.DISC, data, 10, duration)}
                onSaveDraft={(data) => saveDraft(ExerciseType.DISC, data)}
                initialDraftPromise={Promise.resolve(getInitialDraft(ExerciseType.DISC))}
              />
            )}
            {exerciseType === ExerciseType.SKILL_MAPPING && (
              <SkillMappingTool
                onSave={(data, duration) =>
                  saveResult(ExerciseType.SKILL_MAPPING, data, 10, duration)
                }
                onSaveDraft={(data) => saveDraft(ExerciseType.SKILL_MAPPING, data)}
                initialDraftPromise={Promise.resolve(getInitialDraft(ExerciseType.SKILL_MAPPING))}
                experiences={selectedEmployee?.experiences || []}
              />
            )}
            {exerciseType === ExerciseType.CIRCLE_OF_CONTROL && (
              <CircleOfControlTool
                onSave={(data, duration) =>
                  saveResult(ExerciseType.CIRCLE_OF_CONTROL, data, 10, duration)
                }
                onSaveDraft={(data) => saveDraft(ExerciseType.CIRCLE_OF_CONTROL, data)}
                initialDraftPromise={Promise.resolve(
                  getInitialDraft(ExerciseType.CIRCLE_OF_CONTROL)
                )}
              />
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  )
}
