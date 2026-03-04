import React, { useEffect } from 'react'
import 'react-datepicker/dist/react-datepicker.css'
import { Head, Link, router } from '@inertiajs/react'
import DashboardLayout from '../../components/DashboardLayout'
import Button from '../../components/ui/Button'
import MotivationTool from '../../components/MotivationTool'
import ValuesTool from '../../components/ValuesTool'
import PersonalityTool from '../../components/PersonalityTool'
import LifeCurveTool from '../../components/LifeCurveTool'
import TargetingTool from '../../components/TargetingTool'
import DISCTool from '../../components/DISCTool'
import SkillMappingTool from '../../components/SkillMappingTool'
import CircleOfControlTool from '../../components/CircleOfControlTool'
import { ExerciseType, type ExerciseDraft } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import { useEmployee } from '../../hooks/useEmployee'
import { useExercises } from '../../hooks/useExercises'

interface ExerciseProps {
  type: string
  employeeId?: string
  initialMotivationDraft?: ExerciseDraft | null
  initialValuesDraft?: ExerciseDraft | null
  initialPersonalityDraft?: ExerciseDraft | null
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

export default function DashboardExercise({
  type,
  employeeId,
  initialMotivationDraft,
  initialValuesDraft,
  initialPersonalityDraft,
}: ExerciseProps) {
  const { user } = useAuth()
  const targetId = employeeId || user?.id || '1'
  const { employee: selectedEmployee, refreshEmployee } = useEmployee(targetId)
  const { isAnalyzing, isSavingDraft, saveResult, saveDraft, loadDraft } = useExercises(
    selectedEmployee,
    async () => {
      await refreshEmployee()
      if (employeeId) router.visit(`/dashboard/employees/${employeeId}`)
      else router.visit('/dashboard')
    },
    {
      motivation: {
        initialDraft: initialMotivationDraft ?? null,
      },
      values: {
        initialDraft: initialValuesDraft ?? null,
      },
      personality: {
        initialDraft: initialPersonalityDraft ?? null,
      },
    }
  )

  const exerciseType = EXERCISE_TYPES[type] ?? null
  const backHref = employeeId ? `/dashboard/employees/${employeeId}` : '/dashboard'

  useEffect(() => {
    if (!user) router.visit('/auth')
  }, [user])

  if (!user) return null
  if (!exerciseType) {
    router.visit(backHref)
    return null
  }

  return (
    <>
      <Head title={`Exercice ${type}`} />
      <DashboardLayout selectedEmployeeId={employeeId || null}>
        <div className="animate-fadeIn max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <Link href={backHref}>
              <Button variant="ghost" size="sm">
                ← Retour
              </Button>
            </Link>
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
                initialDraftPromise={Promise.resolve(initialMotivationDraft ?? null)}
              />
            )}
            {exerciseType === ExerciseType.VALUES && (
              <ValuesTool
                onSave={(data, duration) => saveResult(ExerciseType.VALUES, data, 10, duration)}
                onSaveDraft={(data) => saveDraft(ExerciseType.VALUES, data)}
                initialDraftPromise={Promise.resolve(initialValuesDraft ?? null)}
              />
            )}
            {exerciseType === ExerciseType.LIFE_CURVE && (
              <LifeCurveTool
                onSave={(data, duration) => saveResult(ExerciseType.LIFE_CURVE, data, 10, duration)}
                onSaveDraft={(data) => saveDraft(ExerciseType.LIFE_CURVE, data)}
                initialDraftPromise={loadDraft(ExerciseType.LIFE_CURVE)}
              />
            )}
            {exerciseType === ExerciseType.PERSONALITY && (
              <PersonalityTool
                onSave={(data, duration) => saveResult(ExerciseType.PERSONALITY, data, 10, duration)}
                // Personality currently has no explicit draft UI, but results are saved via Inertia.
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
                initialDraftPromise={loadDraft(ExerciseType.DISC)}
              />
            )}
            {exerciseType === ExerciseType.SKILL_MAPPING && (
              <SkillMappingTool
                onSave={(data, duration) =>
                  saveResult(ExerciseType.SKILL_MAPPING, data, 10, duration)
                }
                onSaveDraft={(data) => saveDraft(ExerciseType.SKILL_MAPPING, data)}
                initialDraftPromise={loadDraft(ExerciseType.SKILL_MAPPING)}
                experiences={selectedEmployee?.experiences || []}
              />
            )}
            {exerciseType === ExerciseType.CIRCLE_OF_CONTROL && (
              <CircleOfControlTool
                onSave={(data, duration) =>
                  saveResult(ExerciseType.CIRCLE_OF_CONTROL, data, 10, duration)
                }
                onSaveDraft={(data) => saveDraft(ExerciseType.CIRCLE_OF_CONTROL, data)}
                initialDraftPromise={loadDraft(ExerciseType.CIRCLE_OF_CONTROL)}
              />
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  )
}
