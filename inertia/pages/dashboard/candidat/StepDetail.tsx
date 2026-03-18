import { useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import ExerciseResultVisualization from '~/components/exercises/ExerciseResultVisualization'
import Badge from '~/components/ui/Badge'
import Breadcrumb from '~/components/ui/Breadcrumb'
import { useAuth } from '~/hooks/useAuth'
import type { ExerciseResult, SupportPlanStep } from '~/types'

interface StepDetailProps {
  step: SupportPlanStep
  result: ExerciseResult | null
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

export default function StepDetail({ step, result }: StepDetailProps) {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) router.visit('/auth/login')
  }, [user])

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="w-8 h-8 border-2 border-brand-sage border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  const breadcrumbItems = [
    { label: 'Mon espace', href: '/dashboard/candidat' },
    { label: 'Ma feuille de route' },
    { label: step.title },
  ]

  const renderResult = () => {
    if (!result) {
      return (
        <div className="py-20 text-center text-slate-400">
          <p className="font-medium italic">Aucun résultat disponible pour cette étape.</p>
        </div>
      )
    }
    return <ExerciseResultVisualization result={result} />
  }

  return (
    <DashboardLayout>
      <Head title={step.title} />
      <div className="animate-fadeIn">
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <Badge variant={step.completed ? 'lime' : 'slate'}>
              {step.completed ? 'Étape Validée' : 'En attente'}
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
            {step.title}
          </h1>
          <p className="text-slate-500 mt-4 text-lg font-medium">{step.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            <section className="space-y-6">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] px-2">
                Visualisation du Résultat
              </h3>
              {renderResult()}
            </section>

            {result?.qualitativeAnalysis && (
              <section className="space-y-4 pb-10">
                <h3 className="text-[11px] font-black text-violet-600 uppercase tracking-[0.4em] px-2">
                  Analyse Synthétique Gemini
                </h3>
                <div className="bg-violet-50/50 p-10 rounded-[48px] border border-violet-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-violet-600" />
                  <p className="italic text-violet-900 leading-relaxed text-base font-medium relative z-10">
                    &quot;{result.qualitativeAnalysis}&quot;
                  </p>
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-50 p-8 rounded-[48px] border border-slate-100 shadow-sm">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">
                Informations Session
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Échéance prévue
                  </div>
                  <div className="text-base font-black text-slate-900">
                    {formatSessionDate(step.dueDate)}
                  </div>
                </div>
                {result && (
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Passage le
                    </div>
                    <div className="text-base font-black text-slate-900">
                      {formatSessionDate(result.date)}
                    </div>
                  </div>
                )}
                {result && (
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Durée totale
                    </div>
                    <div className="text-base font-black text-slate-900">
                      {Math.floor(result.duration / 60)} min {result.duration % 60} s
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
