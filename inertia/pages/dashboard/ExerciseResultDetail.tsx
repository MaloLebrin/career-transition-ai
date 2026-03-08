import React, { useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLink from '../../components/ui/AppLink'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ExerciseResultVisualization from '../../components/exercises/ExerciseResultVisualization'
import { useAuth } from '../../hooks/useAuth'
import type { ExerciseResult } from '../../types'

interface ExerciseResultDetailProps {
  employeeId: string
  employeeName: string
  result: (Omit<ExerciseResult, 'type'> & { type: string }) | null
  exerciseType: string
  exerciseTitle: string
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

export default function ExerciseResultDetail({
  employeeId,
  employeeName,
  result,
  exerciseType,
  exerciseTitle,
}: ExerciseResultDetailProps) {
  const { user } = useAuth()
  const backHref = `/dashboard/conseiller/employees/${employeeId}/exercises`

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

  return (
    <DashboardLayout selectedEmployeeId={employeeId}>
      <Head title={`${exerciseTitle} - ${employeeName}`} />
      <div className="animate-fadeIn max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <AppLink href={backHref}>
            <Button variant="ghost" size="sm">
              ← Retour aux résultats
            </Button>
          </AppLink>
        </div>

        {!result ? (
          <Card className="p-12 text-center">
            <p className="text-brand-navy/60 font-medium italic">
              Aucun résultat enregistré pour cet exercice.
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-brand-navy tracking-tight">
                {exerciseTitle}
              </h1>
              <p className="text-brand-navy/60 mt-1">Résultat de {employeeName}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-12">
                <section className="space-y-6">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] px-2">
                    Visualisation du résultat
                  </h3>
                  <ExerciseResultVisualization result={result as ExerciseResult} />
                </section>

                {result.qualitativeAnalysis && (
                  <section className="space-y-4 pb-10">
                    <h3 className="text-[11px] font-black text-violet-600 uppercase tracking-[0.4em] px-2">
                      Analyse synthétique Gemini
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
                    Informations session
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Passage le
                      </div>
                      <div className="text-base font-black text-slate-900">
                        {formatSessionDate(result.date)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Durée totale
                      </div>
                      <div className="text-base font-black text-slate-900">
                        {Math.floor(result.duration / 60)} min {result.duration % 60} s
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
