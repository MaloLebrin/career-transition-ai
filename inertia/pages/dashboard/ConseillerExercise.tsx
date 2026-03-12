import { useEffect } from 'react'
import 'react-datepicker/dist/react-datepicker.css'
import { Head, router } from '@inertiajs/react'
import AppLink from '../../components/ui/AppLink'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import Button from '../../components/ui/Button'
import MotivationTool from '../../components/exercises/MotivationTool'
import ValuesTool from '../../components/exercises/ValuesTool'
import PersonalityTool from '../../components/exercises/PersonalityTool'
import LifeCurveTool from '../../components/exercises/LifeCurveTool'
import TargetingTool from '../../components/exercises/TargetingTool'
import DISCTool from '../../components/exercises/DISCTool'
import SkillMappingTool from '../../components/exercises/SkillMappingTool'
import CircleOfControlTool from '../../components/exercises/CircleOfControlTool'
import { ExerciseType, type ExerciseDraft } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import { useEmployee } from '../../hooks/use_employee'
import { useExercises } from '../../hooks/useExercises'
import { EXERCISE_SLUGS } from '../../config/exercises'

interface ConseillerExerciseProps {
  type: string
  employeeId: string
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
  initialDraftsByType,
}: ConseillerExerciseProps) {
  const { user } = useAuth()
  const { employee: selectedEmployee, refreshEmployee } = useEmployee(employeeId)

  const draftsByType = initialDraftsByType ?? {}
  const getInitialDraft = (exerciseType: ExerciseType): ExerciseDraft | null => {
    const slug = EXERCISE_SLUGS[exerciseType]
    return slug ? draftsByType[slug] ?? null : null
  }

  const backHref = `/dashboard/conseiller/employees/${employeeId}`
  const exercisesBasePath = `${backHref}/exercises`

  const { isAnalyzing, isSavingDraft, saveResult, saveDraft } = useExercises(
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

  useEffect(() => {
    if (!user) router.visit('/auth/login')
  }, [user])

  if (!user || !exerciseType) return null

  return (
    <>
      <Head title={`Exercice ${type}`} />
      <DashboardLayout selectedEmployeeId={employeeId}>
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
          {isAnalyzing && (
            <div className="fixed inset-0 bg-brand-ivory/95 backdrop-blur-3xl z-[100] flex flex-col items-center justify-center">
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
