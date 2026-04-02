import { Head, router } from '@inertiajs/react'
import { useState } from 'react'
import SupportPlanStep from '../../../app/models/support_plan_step'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import AppLink from '../../components/ui/AppLink'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { EXERCISE_LIST, EXERCISE_SLUGS } from '../../config/exercises'
import { useAuth } from '../../hooks/use_auth'
import { useEmployee } from '../../hooks/use_employee'
import type { Employee } from '../../types/employee'

interface EmployeeDetailProps {
  employeeId: string
  employee: Employee
}

export default function DashboardEmployeeDetail({ employeeId, employee }: EmployeeDetailProps) {
  const { user } = useAuth()
  const { employee: selectedEmployee } = useEmployee(employeeId, employee)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const normalizeExerciseType = (t: string | undefined): string =>
    (t ?? '').toUpperCase().replace(/-/g, '_')

  const getResultsForStep = (step: SupportPlanStep) => {
    if (!selectedEmployee || !step.associatedExercises || step.associatedExercises.length === 0) return []
    const stepTypes = step.associatedExercises.map(normalizeExerciseType)
    return selectedEmployee.exercises.filter(
      (res) => stepTypes.includes(normalizeExerciseType(res.type))
    )
  }

  const hasAnyResultForStep = (step: SupportPlanStep): boolean => {
    return getResultsForStep(step).length > 0
  }

  const handleDownloadPDF = async () => {
    if (!selectedEmployee) return
    setIsGeneratingPDF(true)
    try {
      const { generateComprehensivePDF } = await import('../../services/pdfService')
      await generateComprehensivePDF(selectedEmployee)
    } catch (err) {
      alert('Erreur PDF.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (!user) return null
  if (!selectedEmployee) {
    return (
      <>
        <Head title="Candidat" />
        <DashboardLayout selectedEmployeeId={employeeId}>
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="w-8 h-8 border-2 border-brand-sage border-t-transparent rounded-full animate-spin" />
          </div>
        </DashboardLayout>
      </>
    )
  }

  return (
    <>
      <Head title={selectedEmployee.name} />
      <DashboardLayout selectedEmployeeId={employeeId}>
        <div className="space-y-8 animate-fadeIn">
          <Card className="p-8 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 rounded-2xl bg-brand-ivory flex items-center justify-center text-brand-sage font-bold text-xl">
                {selectedEmployee.name[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-brand-navy">{selectedEmployee.name}</h2>
                <p className="text-brand-navy/60 text-sm font-medium">
                  {selectedEmployee.currentRole}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <AppLink href={`/dashboard/conseiller/employees/${employeeId}/profile`}>
                <Button variant="outline" size="sm">
                  Voir le profil
                </Button>
              </AppLink>
              <a
                href={`/dashboard/conseiller/employees/${employeeId}/dossier`}
                className="inline-flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-2 border-brand-navy/10 text-brand-navy/60 hover:border-brand-navy hover:text-brand-navy px-4 py-2 text-sm rounded-xl gap-2"
              >
                <svg
                  className="w-4 h-4 stroke-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Télécharger le dossier
              </a>
              <Button
                onClick={handleDownloadPDF}
                variant="dark"
                size="sm"
                isLoading={isGeneratingPDF}
                disabled={!selectedEmployee?.plan.some((step) => step.completed)}
                icon={
                  <svg
                    className="w-4 h-4 stroke-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                }
              >
                Rapport Expert
              </Button>
            </div>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-brand-sage/5 p-8 rounded-[40px] border border-brand-sage/10 shadow-sm">
                <h3 className="text-sm font-bold text-brand-sage uppercase tracking-widest mb-4">
                  Notes d'accompagnement
                </h3>
                <textarea
                  className="w-full bg-white/50 border border-brand-sage/10 rounded-3xl p-6 text-sm min-h-[120px] outline-none focus:ring-2 focus:ring-brand-sage transition-all resize-none"
                  defaultValue={selectedEmployee.advisorNotes || ''}
                  onBlur={(e) => {
                    const value = e.target.value
                    router.put(`/dashboard/conseiller/employees/${employeeId}`, { advisorNotes: value })
                  }}
                />
              </div>
              <Card className="p-10">
                <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest mb-8">
                  Feuille de Route
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedEmployee.plan.map((step) => {
                    const hasResults = hasAnyResultForStep(step)
                    const exerciseCount = step.associatedExercises?.length ?? 0
                    return (
                      <AppLink
                        key={step.id}
                        href={`/dashboard/conseiller/employees/${employeeId}/steps/${step.id}`}
                        className="block"
                      >
                        <div className="group cursor-pointer p-6 rounded-[32px] border border-brand-navy/5 bg-brand-ivory/30 hover:bg-white hover:border-brand-sage/30 hover:shadow-xl transition-all flex flex-col justify-between">
                          <div className="mb-4">
                            <div
                              className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                                step.completed
                                  ? 'bg-brand-sage/20 text-brand-sage'
                                  : 'bg-brand-navy/10 text-brand-navy/40'
                              }`}
                            >
                              {step.completed ? 'Validée' : 'À faire'}
                            </div>
                            <h4 className="font-bold text-brand-navy text-lg group-hover:text-brand-sage mt-2">
                              {step.title}
                            </h4>
                          </div>
                          {hasResults ? (
                            <div className="pt-4 border-t border-brand-navy/5">
                              <span className="text-[9px] font-bold text-brand-sage uppercase tracking-widest">
                                Voir les résultats →
                              </span>
                            </div>
                          ) : exerciseCount > 0 ? (
                            <div className="pt-4 border-t border-brand-navy/5">
                              <span className="text-[10px] font-bold text-brand-sage uppercase tracking-widest">
                                {exerciseCount} exercice{exerciseCount > 1 ? 's' : ''} →
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </AppLink>
                    )
                  })}
                </div>
                <div className="mt-8 pt-8 border-t border-brand-navy/5">
                  <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest mb-4">
                    Résultats des exercices
                  </h3>
                  {selectedEmployee.exercises.length === 0 ? (
                    <p className="text-brand-navy/60 text-sm">
                      Aucun exercice réalisé pour l&apos;instant.
                    </p>
                  ) : (
                    (() => {
                      const byType = new Map<string, typeof selectedEmployee.exercises[0]>()
                      for (const res of selectedEmployee.exercises) {
                        const key = (res.type as string).toLowerCase()
                        const existing = byType.get(key)
                        if (!existing || (res.date && (!existing.date || res.date > existing.date))) {
                          byType.set(key, res)
                        }
                      }
                      const latestResults = Array.from(byType.values())
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {latestResults.map((res) => {
                            const slug =
                              EXERCISE_SLUGS[res.type as keyof typeof EXERCISE_SLUGS] ??
                              (res.type as string).toLowerCase()
                            const title =
                              EXERCISE_LIST.find((e) => e.slug === slug)?.title ?? (res.type as string)
                            const dateStr = res.date
                              ? new Date(res.date).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'
                            return (
                              <AppLink
                                key={res.id}
                                href={`/dashboard/conseiller/employees/${employeeId}/exercises/results/${slug}`}
                                className="block p-4 rounded-2xl border border-brand-navy/5 bg-brand-ivory/30 hover:bg-white hover:border-brand-sage/30 hover:shadow-md transition-all"
                              >
                                <h4 className="font-bold text-brand-navy">{title}</h4>
                                <p className="text-brand-navy/60 text-xs mt-1">
                                  Complété le {dateStr}
                                </p>
                              </AppLink>
                            )
                          })}
                        </div>
                      )
                    })()
                  )}
                </div>
              </Card>
            </div>
            <div className="lg:col-span-4 space-y-8">
              <Card className="p-8">
                <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest mb-6">
                  Expertises détectées
                </h3>
                <div className="space-y-5">
                  {selectedEmployee.skills.map((s, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold text-brand-navy uppercase">
                          {s.name}
                        </span>
                        <span className="text-[9px] font-bold text-brand-sage">{s.level}/5</span>
                      </div>
                      <div className="h-1 bg-brand-navy/5 rounded-full w-full">
                        <div
                          className="h-full bg-brand-sage rounded-full"
                          style={{ width: `${(s.level / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  )
}
