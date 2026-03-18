import { useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import NotesSection from '~/components/dashboard/NotesSection'
import ExerciseResultVisualization from '~/components/exercises/ExerciseResultVisualization'
import Badge from '~/components/ui/Badge'
import Breadcrumb from '~/components/ui/Breadcrumb'
import { useAuth } from '~/hooks/useAuth'
import type { ExerciseResult, SupportPlanStep } from '~/types'
import { EXERCISE_LIST } from '~/config/exercises'

interface StepDetailProps {
  employeeId: string
  employeeName: string
  step: SupportPlanStep
  results: ExerciseResult[]
}

function formatSessionDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getExerciseTitle(type: string): string {
  const exercise = EXERCISE_LIST.find((e) => e.slug === type.toLowerCase())
  return exercise?.title ?? type
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

  const renderResults = () => {
    if (!results || results.length === 0) {
      return (
        <div className="py-20 text-center text-slate-400">
          <p className="font-medium italic">Aucun résultat disponible pour cette étape.</p>
        </div>
      )
    }

    return (
      <div className="space-y-12">
        {results.map((result) => (
          <div key={result.id} className="space-y-6">
            <h4 className="text-lg font-bold text-slate-800">
              {getExerciseTitle(result.type)}
            </h4>
            <ExerciseResultVisualization result={result} />
            {result.qualitativeAnalysis && (
              <div className="bg-violet-50/50 p-8 rounded-[32px] border border-violet-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-violet-600" />
                <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-2">
                  Analyse Gemini
                </p>
                <p className="italic text-violet-900 leading-relaxed text-sm font-medium relative z-10">
                  &quot;{result.qualitativeAnalysis}&quot;
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <DashboardLayout selectedEmployeeId={employeeId}>
      <Head title={`${stepTitle} - ${employeeName}`} />
      <div className="animate-fadeIn">
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <Badge variant={step.completed ? 'lime' : 'slate'}>
              {step.completed ? 'Étape Validée' : 'En attente'}
            </Badge>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
              Dossier #{String(step.id).slice(0, 8)}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
            {stepTitle}
          </h1>
          {step.scheduledAt && (
            <p className="text-brand-terracotta mt-2 text-lg font-medium">
              {new Date(step.scheduledAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
          {step.instructions && (
            <p className="text-slate-500 mt-4 text-lg font-medium">{step.instructions}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            <section className="space-y-6">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] px-2">
                {results.length > 1 ? 'Résultats des exercices' : 'Visualisation du Résultat'}
              </h3>
              {renderResults()}
            </section>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-50 p-8 rounded-[48px] border border-slate-100 shadow-sm">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">
                Informations Session
              </h3>
              <div className="space-y-6">
                {step.scheduledAt && (
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Date du RDV
                    </div>
                    <div className="text-base font-black text-slate-900">
                      {formatSessionDate(step.scheduledAt)}
                    </div>
                  </div>
                )}
                {step.locationOrLink && (
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Lieu / Lien
                    </div>
                    <div className="text-base font-medium text-slate-900">
                      {step.locationOrLink}
                    </div>
                  </div>
                )}
                {step.associatedExercises && step.associatedExercises.length > 0 && (
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Exercices associés
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {step.associatedExercises.map((exerciseType) => (
                        <span
                          key={exerciseType}
                          className="text-xs font-bold text-brand-sage bg-brand-sage/10 px-3 py-1 rounded-full"
                        >
                          {getExerciseTitle(exerciseType)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {results.length > 0 && (
              <NotesSection
                employeeId={Number(employeeId)}
                context="exercise"
                exerciseResultId={results[0].id}
                title="Notes sur cet exercice"
                isAdvisor={true}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
