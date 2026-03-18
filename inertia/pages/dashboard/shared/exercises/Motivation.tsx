import { useEffect } from 'react'
import 'react-datepicker/dist/react-datepicker.css'
import { Head, router } from '@inertiajs/react'
import AppLink from '~/components/ui/AppLink'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import Button from '~/components/ui/Button'
import MotivationTool from '~/components/exercises/MotivationTool'
import { ExerciseType, type ExerciseDraft } from '~/types'
import { useAuth } from '~/hooks/useAuth'
import { useEmployee } from '~/hooks/use_employee'
import { useExercises } from '~/hooks/useExercises'
import { EXERCISE_SLUGS } from '~/config/exercises'

interface MotivationExerciseProps {
  employeeId?: string
  initialDraftsByType?: Record<string, ExerciseDraft | null>
}

export default function MotivationExercise({
  employeeId,
  initialDraftsByType,
}: MotivationExerciseProps) {
  const { user } = useAuth()
  const targetId = employeeId || user?.id || '1'
  const { employee: selectedEmployee, refreshEmployee } = useEmployee(targetId)
  const draftsByType = initialDraftsByType ?? {}
  const getInitialDraft = (): ExerciseDraft | null => {
    const slug = EXERCISE_SLUGS[ExerciseType.MOTIVATION]
    return slug ? draftsByType[slug] ?? null : null
  }
  const isCandidat = !employeeId
  const exercisesBasePath = isCandidat
    ? '/dashboard/candidat/exercises'
    : `/dashboard/conseiller/employees/${employeeId}/exercises`
  const backHref = isCandidat ? '/dashboard/candidat' : `/dashboard/conseiller/employees/${employeeId}`

  const { isAnalyzing, isSavingDraft, saveResult, saveDraft } = useExercises(
    selectedEmployee,
    async () => {
      await refreshEmployee()
      router.visit(backHref)
    },
    {
      exercisesBasePath,
      motivation: { initialDraft: getInitialDraft() },
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
      <Head title="Exercice Motivations" />
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
            <MotivationTool
              onSave={(data, duration) => saveResult(ExerciseType.MOTIVATION, data, 10, duration)}
              onSaveDraft={(data) => saveDraft(ExerciseType.MOTIVATION, data)}
              initialDraftPromise={Promise.resolve(getInitialDraft())}
            />
          </div>
        </div>
      </DashboardLayout>
    </>
  )
}
