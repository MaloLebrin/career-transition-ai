import { Head, router } from '@inertiajs/react'
import 'react-datepicker/dist/react-datepicker.css'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import CircleOfControlTool from '~/components/exercises/CircleOfControlTool'
import DISCTool from '~/components/exercises/DISCTool'
import ExerciseProgressBadge from '~/components/exercises/ExerciseProgressBadge'
import LifeCurveTool from '~/components/exercises/LifeCurveTool'
import MotivationTool from '~/components/exercises/MotivationTool'
import PersonalityTool from '~/components/exercises/PersonalityTool'
import SkillMappingTool from '~/components/exercises/SkillMappingTool'
import TargetingTool from '~/components/exercises/TargetingTool'
import ValuesTool from '~/components/exercises/ValuesTool'
import AppLink from '~/components/ui/AppLink'
import Button from '~/components/ui/Button'
import { EXERCISE_SLUGS } from '~/config/exercises'
import { useCandidateExercises } from '~/hooks/use_candidate_exercises'
import { useEmployee } from '~/hooks/use_employee'
import { ExerciseType, type ExerciseDraft, type ExerciseResult } from '~/types'
import type { Employee } from '~/types/employee'
import type { Skill } from '~/types/skill'

interface CandidatExerciseProps {
  type: string
  /** Employé courant (props Inertia) — requis pour enregistrer brouillon / résultat (useEmployee ne fetch plus en client). */
  employee?: Employee | null
  initialDraftsByType?: Record<string, ExerciseDraft | null>
  accessGranted?: boolean
  blockedMessage?: string
  exerciseProgressPercent?: number
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

export default function CandidatExercise({
  type,
  employee: employeeFromPage,
  initialDraftsByType,
  accessGranted = true,
  blockedMessage,
  exerciseProgressPercent = 0,
}: CandidatExerciseProps) {
  const { employee: selectedEmployee, refreshEmployee } = useEmployee(employeeFromPage?.id ?? null, employeeFromPage ?? null)

  const draftsByType = initialDraftsByType ?? {}
  const getInitialDraft = (exerciseType: ExerciseType): ExerciseDraft | null => {
    const slug = EXERCISE_SLUGS[exerciseType]
    return slug ? draftsByType[slug] ?? null : null
  }

  const { isAnalyzing, isSavingDraft, saveResult, saveDraft } = useCandidateExercises(
    selectedEmployee,
    async () => {
      await refreshEmployee()
      router.visit('/dashboard/candidat')
    },
    {
      exercisesBasePath: '/dashboard/candidat/exercises',
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

  const latestCompletedResultData =
    selectedEmployee && exerciseType
      ? (selectedEmployee.exercises ?? [])
          .filter(
            (r: ExerciseResult) =>
              String(r?.type ?? '').toLowerCase() === String(exerciseType) && Boolean(r?.data)
          )
          .sort((a: ExerciseResult, b: ExerciseResult) => {
            const ad = a?.date ? new Date(a.date).getTime() : 0
            const bd = b?.date ? new Date(b.date).getTime() : 0
            return bd - ad
          })[0]?.data ?? null
      : null

  if (accessGranted === false) {
    return (
      <>
        <Head title={`Exercice ${type}`} />
        <DashboardLayout hideSidebar>
          <div className="animate-fadeIn w-full">
            <div className="flex justify-between items-center mb-10">
              <AppLink href="/dashboard/candidat">
                <Button variant="ghost" size="sm">
                  ← Retour
                </Button>
              </AppLink>
            </div>

            <div className="mt-6 bg-amber-50 border border-amber-100 text-amber-800 px-4 py-4 rounded-xl">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h2 className="text-sm font-bold">Accès verrouillé</h2>
                  <p className="text-sm text-amber-700 mt-1">
                    {blockedMessage ??
                      'Cette étape est verrouillée. Contactez votre conseiller pour la débloquer.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </>
    )
  }

  if (!exerciseType) return null

  return (
    <>
      <Head title={`Exercice ${type}`} />
      <DashboardLayout hideSidebar>
        <div className="animate-fadeIn w-full max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <AppLink href="/dashboard/candidat">
              <Button variant="ghost" size="sm">
                ← Retour
              </Button>
            </AppLink>
            <div className="flex items-center gap-4">
              <ExerciseProgressBadge value={exerciseProgressPercent} />
              {isSavingDraft && (
                <div className="flex items-center space-x-2 text-slate-400">
                  <div className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">
                    Sauvegarde auto...
                  </span>
                </div>
              )}
            </div>
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
                        skills: selectedEmployee.skills.map((s: Skill) => s.name),
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
                initialResultData={latestCompletedResultData}
              />
            )}
            {exerciseType === ExerciseType.SKILL_MAPPING && (
              <SkillMappingTool
                onSave={(data, duration) => saveResult(ExerciseType.SKILL_MAPPING, data, 10, duration)}
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
