import { Head, router } from '@inertiajs/react'
import AppLink from '../../components/ui/AppLink'
import { useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StepDetailModal from '../../components/modals/StepDetailModal'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { useAuth } from '../../hooks/useAuth'
import { useEmployee } from '../../hooks/useEmployee'
import type { Employee, SupportPlanStep } from '../../types'

interface EmployeeDetailProps {
  employeeId: string
  employee: Employee
}

export default function DashboardEmployeeDetail({ employeeId, employee }: EmployeeDetailProps) {
  const { user } = useAuth()
  const { employee: selectedEmployee } = useEmployee(employeeId, employee)
  const [selectedStepForDetail, setSelectedStepForDetail] = useState<SupportPlanStep | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const normalizeExerciseType = (t: string | undefined): string =>
    (t ?? '').toUpperCase().replace(/-/g, '_')

  const getResultForStep = (step: SupportPlanStep) => {
    if (!selectedEmployee || !step.associatedExercise) return null
    const stepType = normalizeExerciseType(step.associatedExercise)
    return selectedEmployee.exercises.find(
      (res) => normalizeExerciseType(res.type) === stepType
    ) ?? null
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

  const userRole = user.role || 'advisor'

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
            <div className="flex space-x-2">
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
                    const result = getResultForStep(step)
                    const content = (
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
                        {result && (
                          <div className="pt-4 border-t border-brand-navy/5">
                            <span className="text-[9px] font-bold text-brand-sage uppercase tracking-widest">
                              Rapport Gemini →
                            </span>
                          </div>
                        )}
                        {step.associatedExercise && !result && (
                          <div className="pt-4">
                            <AppLink
                              href={`/dashboard/conseiller/employees/${employeeId}/exercises/${step.associatedExercise}`}
                              className="text-[10px] font-bold text-brand-sage uppercase tracking-widest hover:underline"
                            >
                              Démarrer l’exercice →
                            </AppLink>
                          </div>
                        )}
                      </div>
                    )
                    return step.associatedExercise && !result ? (
                      <AppLink
                        key={step.id}
                        href={`/dashboard/conseiller/employees/${employeeId}/exercises/${step.associatedExercise}`}
                        className="block"
                      >
                        {content}
                      </AppLink>
                    ) : (
                      <div key={step.id} onClick={() => setSelectedStepForDetail(step)}>
                        {content}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-8 pt-8 border-t border-brand-navy/5">
                  <AppLink
                    href={`/dashboard/conseiller/employees/${employeeId}/exercises`}
                    className="text-brand-sage font-semibold text-sm hover:underline"
                  >
                    Tous les exercices →
                  </AppLink>
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
        {selectedStepForDetail && (
          <StepDetailModal
            step={selectedStepForDetail}
            result={getResultForStep(selectedStepForDetail) || undefined}
            onClose={() => setSelectedStepForDetail(null)}
            userRole={userRole}
          />
        )}
      </DashboardLayout>
    </>
  )
}
