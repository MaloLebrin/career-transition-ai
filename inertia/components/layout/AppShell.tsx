/**
 * @deprecated Navigation is now handled by Inertia routes and dashboard/* pages.
 * Use DashboardLayout + dashboard/Home, dashboard/EmployeeDetail, etc. instead.
 */
import { formatDateTimeFR } from '#shared/helpers/date'
import { router } from '@inertiajs/react'
import React, { useEffect, useState } from 'react'
import { employeeUpdatePayload } from '../../helpers/employee_payload'
import { useAuth } from '../../hooks/useAuth'
import { useEmployee } from '../../hooks/use_employee'
import { useEmployees } from '../../hooks/use_employees'
import { useAdvisorExercises } from '../../hooks/use_advisor_exercises'
import { ExerciseType, SupportPlanStep } from '../../types'
import DesignSystem from '../design-system/DesignSystem'
import CircleOfControlTool from '../exercises/CircleOfControlTool'
import DISCTool from '../exercises/DISCTool'
import LifeCurveTool from '../exercises/LifeCurveTool'
import MotivationTool from '../exercises/MotivationTool'
import PersonalityTool from '../exercises/PersonalityTool'
import SkillMappingTool from '../exercises/SkillMappingTool'
import TargetingTool from '../exercises/TargetingTool'
import ValuesTool from '../exercises/ValuesTool'
import AddEmployeeModal from '../modals/AddEmployeeModal'
import OnboardingFlow from '../onboarding/OnboardingFlow'
import ProfilePage from '../profile/ProfilePage'
import OrganizationSettings from '../settings/OrganizationSettings'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'
import NavButton from '../ui/NavButton'
import StatCard from '../ui/StatCard'
import Layout from './Layout'

const AppShell: React.FC = () => {
  const { user, logout } = useAuth()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [activeNav, setActiveNav] = useState<
    'dashboard' | 'employees' | 'settings' | 'design-system'
  >('dashboard')
  const [activeView, setActiveView] = useState<
    'detail' | 'exercise' | 'profile-edit' | 'org-settings' | 'design-system'
  >('detail')
  const [currentTool, setCurrentTool] = useState<ExerciseType | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const { employees, filteredEmployees, loading: employeesLoading } = useEmployees(searchTerm)

  const userRole = user?.role || 'employee'
  const targetId = userRole === 'employee' ? String(user?.id ?? 1) : selectedEmployeeId
  const { employee: selectedEmployee, refreshEmployee } = useEmployee(targetId)

  const { isAnalyzing, isSavingDraft, saveResult, saveDraft, loadDraft } = useAdvisorExercises(
    selectedEmployee,
    async () => {
      await refreshEmployee()
      setActiveView('detail')
      setCurrentTool(null)
    }
  )

  const handleLogout = () => {
    logout()
    setSelectedEmployeeId(null)
    setCurrentTool(null)
    setActiveView('detail')
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

  const getResultsForStep = (step: SupportPlanStep) => {
    if (!selectedEmployee || !step.associatedExercises || step.associatedExercises.length === 0) return []
    return selectedEmployee.exercises.filter((res) => step.associatedExercises?.includes(res.type))
  }

  useEffect(() => {
    if (userRole === 'advisor' && !selectedEmployeeId && employees.length > 0) {
      setSelectedEmployeeId(String(employees[0].id))
    }
  }, [userRole, employees, selectedEmployeeId])

  if (!user) {
    return null
  }

  if (activeView === 'profile-edit' && userRole === 'employee' && selectedEmployee) {
    return (
      <ProfilePage
        employee={selectedEmployee}
        onSave={(updated) => {
          router.put(
            `/dashboard/employees/${selectedEmployee.id}`,
            employeeUpdatePayload(updated) as any,
            {
              onSuccess: () => setActiveView('detail'),
            }
          )
        }}
        onBack={() => setActiveView('detail')}
      />
    )
  }

  return (
    <Layout
      userRole={userRole}
      onRoleChange={() => {}}
      onLogout={handleLogout}
      userName={user?.name}
    >
      {activeView === 'exercise' ? (
        <div className="animate-fadeIn max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <Button
              onClick={() => {
                setActiveView('detail')
                setCurrentTool(null)
              }}
              variant="ghost"
              size="sm"
            >
              ← Retour
            </Button>
            {isSavingDraft && (
              <div className="flex items-center space-x-2 text-slate-400">
                <div className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-black uppercase tracking-widest italic">
                  Sauvegarde auto...
                </span>
              </div>
            )}
          </div>
          {isAnalyzing && (
            <div className="fixed inset-0 bg-brand-ivory/95 backdrop-blur-3xl z-100 flex flex-col items-center justify-center">
              <div className="w-24 h-24 border-4 border-brand-sage border-t-transparent rounded-full animate-spin mb-10"></div>
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
            {currentTool === ExerciseType.MOTIVATION && (
              <MotivationTool
                onSave={(data, duration) => saveResult(ExerciseType.MOTIVATION, data, 10, duration)}
                onSaveDraft={(data) => saveDraft(ExerciseType.MOTIVATION, data)}
                initialDraftPromise={loadDraft(ExerciseType.MOTIVATION)}
              />
            )}
            {currentTool === ExerciseType.VALUES && (
              <ValuesTool
                onSave={(data, duration) => saveResult(ExerciseType.VALUES, data, 10, duration)}
                onSaveDraft={(data) => saveDraft(ExerciseType.VALUES, data)}
                initialDraftPromise={loadDraft(ExerciseType.VALUES)}
              />
            )}
            {currentTool === ExerciseType.LIFE_CURVE && (
              <LifeCurveTool
                onSave={(data, duration) => saveResult(ExerciseType.LIFE_CURVE, data, 10, duration)}
                onSaveDraft={(data) => saveDraft(ExerciseType.LIFE_CURVE, data)}
                initialDraftPromise={loadDraft(ExerciseType.LIFE_CURVE)}
              />
            )}
            {currentTool === ExerciseType.PERSONALITY && (
              <PersonalityTool
                onSave={(data, duration) =>
                  saveResult(ExerciseType.PERSONALITY, data, 10, duration)
                }
              />
            )}
            {currentTool === ExerciseType.TARGETING && (
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
            {currentTool === ExerciseType.DISC && (
              <DISCTool
                onSave={(data, duration) => saveResult(ExerciseType.DISC, data, 10, duration)}
                onSaveDraft={(data) => saveDraft(ExerciseType.DISC, data)}
                initialDraftPromise={loadDraft(ExerciseType.DISC)}
              />
            )}
            {currentTool === ExerciseType.SKILL_MAPPING && (
              <SkillMappingTool
                onSave={(data, duration) =>
                  saveResult(ExerciseType.SKILL_MAPPING, data, 10, duration)
                }
                onSaveDraft={(data) => saveDraft(ExerciseType.SKILL_MAPPING, data)}
                initialDraftPromise={loadDraft(ExerciseType.SKILL_MAPPING)}
                experiences={selectedEmployee?.experiences || []}
              />
            )}
            {currentTool === ExerciseType.CIRCLE_OF_CONTROL && (
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
      ) : userRole === 'advisor' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-[24px] border border-brand-navy/5 p-3 sticky top-24 shadow-sm">
              <nav className="space-y-0.5">
                <div className="px-3 py-2 mb-2">
                  <h3 className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.2em]">
                    Navigation
                  </h3>
                </div>
                <NavButton
                  active={activeNav === 'dashboard'}
                  onClick={() => {
                    setActiveNav('dashboard')
                    setActiveView('detail')
                  }}
                  icon="dashboard"
                  label="Bureau"
                />
                <NavButton
                  active={activeNav === 'employees'}
                  onClick={() => {
                    setActiveNav('employees')
                    setActiveView('detail')
                  }}
                  icon="users"
                  label="Candidats"
                />
                <NavButton
                  active={activeNav === 'settings'}
                  onClick={() => {
                    setActiveNav('settings')
                    setActiveView('org-settings')
                  }}
                  icon="settings"
                  label="Réglages"
                />
                <NavButton
                  active={activeNav === 'design-system'}
                  onClick={() => {
                    setActiveNav('design-system')
                    setActiveView('design-system')
                  }}
                  icon="palette"
                  label="Design"
                />

                <div className="pt-4 mt-4 border-t border-brand-navy/5">
                  <div className="px-3 py-2">
                    <h4 className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.2em]">
                      Candidats
                    </h4>
                  </div>
                  <div className="px-2 mb-3">
                    <Input
                      placeholder="Filtrer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      sizeVariant="sm"
                    />
                  </div>
                  <div className="space-y-0.5 max-h-[350px] overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-brand-navy/5">
                    {employeesLoading ? (
                      <div className="py-6 text-center">
                        <div className="w-4 h-4 border-2 border-brand-sage/10 border-t-brand-sage rounded-full animate-spin mx-auto mb-2"></div>
                        <span className="text-[9px] font-bold text-brand-navy/40 uppercase tracking-widest">
                          Chargement
                        </span>
                      </div>
                    ) : filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => {
                            setSelectedEmployeeId(String(emp.id))
                            setActiveNav('employees')
                            setActiveView('detail')
                          }}
                          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all group cursor-pointer disabled:cursor-not-allowed ${
                            Number(selectedEmployeeId) === emp.id && activeNav === 'employees'
                              ? 'bg-brand-sage/10 text-brand-sage'
                              : 'text-brand-navy/60 hover:bg-brand-ivory'
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-125 ${
                              !emp.onboarded ? 'bg-brand-terracotta' : 'bg-brand-sage'
                            }`}
                          ></div>
                          <span className="text-[11px] font-medium truncate">{emp.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="py-6 px-4 text-center">
                        <p className="text-[9px] font-bold text-brand-navy/20 uppercase tracking-widest">
                          Aucun résultat
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </nav>
            </div>
          </aside>

          <div className="lg:col-span-3">
            {activeNav === 'dashboard' ? (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold text-brand-navy">Activité Globale</h2>
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    size="md"
                    variant="secondary"
                    icon={
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    }
                  >
                    Nouveau Candidat
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard label="Total suivis" value={employees.length} color="navy" />
                  <StatCard
                    label="En attente"
                    value={employees.filter((e) => !e.onboarded).length}
                    color="terracotta"
                  />
                  <StatCard
                    label="Étapes validées"
                    value={employees.reduce((acc, e) => acc + (e.exercises?.length ?? 0), 0)}
                    color="sage"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="p-8">
                    <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest mb-6">
                      Dernières Activités
                    </h3>
                    <div className="space-y-4">
                      {employees
                        .flatMap((e) =>
                          (e.exercises ?? []).map((ex) => ({
                            ...ex,
                            employeeName: e.name,
                            employeeId: e.id,
                          }))
                        )
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 5)
                        .map((activity, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-4 rounded-2xl bg-brand-ivory/50 border border-brand-navy/5"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-xl bg-brand-sage/10 text-brand-sage flex items-center justify-center font-bold text-xs">
                                {activity.employeeName[0]}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-brand-navy">
                                  {activity.employeeName}
                                </p>
                                <p className="text-[10px] font-medium text-brand-navy/60">
                                  {activity.type}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-brand-sage uppercase tracking-widest">
                                {new Date(activity.date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                        ))}
                      {employees.reduce((acc, e) => acc + (e.exercises?.length ?? 0), 0) === 0 && (
                        <p className="text-center py-8 text-brand-navy/40 text-xs font-medium italic">
                          Aucune activité récente
                        </p>
                      )}
                    </div>
                  </Card>

                  <Card className="p-8">
                    <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest mb-6">
                      Prochains Rendez-vous
                    </h3>
                    <div className="space-y-4">
                      {(() => {
                        const now = new Date()
                        const upcomingSteps = employees
                          .flatMap((e) =>
                            (e.plan ?? [])
                              .filter((step) => step.scheduledAt && new Date(step.scheduledAt) > now && step.status === 'scheduled')
                              .map((step) => ({ ...step, employeeName: e.name, employeeId: e.id }))
                          )
                          .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
                          .slice(0, 5)
                        
                        return upcomingSteps.length > 0 ? (
                          upcomingSteps.map((step, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-4 rounded-2xl bg-brand-terracotta/5 border border-brand-terracotta/10"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-xl bg-brand-terracotta/10 text-brand-terracotta flex items-center justify-center">
                                  <svg
                                    className="w-5 h-5 stroke-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-brand-navy">{step.employeeName}</p>
                                  <p className="text-[10px] font-medium text-brand-navy/60">
                                    RDV {(step.sortOrder ?? 0) + 1}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-brand-terracotta uppercase tracking-widest">
                                  {formatDateTimeFR(step.scheduledAt!)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center py-8 text-brand-navy/40 text-xs font-medium italic">
                            Aucun rendez-vous planifié
                          </p>
                        )
                      })()}
                    </div>
                  </Card>
                </div>
              </div>
            ) : activeNav === 'settings' ? (
              <div className="animate-fadeIn">
                <OrganizationSettings
                  onBack={() => {
                    setActiveNav('dashboard')
                    setActiveView('detail')
                  }}
                />
              </div>
            ) : activeNav === 'design-system' ? (
              <div className="animate-fadeIn">
                <DesignSystem
                  onBack={() => {
                    setActiveNav('dashboard')
                    setActiveView('detail')
                  }}
                />
              </div>
            ) : selectedEmployee ? (
              <div className="space-y-8 animate-fadeIn">
                <Card className="p-8 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 rounded-2xl bg-brand-ivory flex items-center justify-center text-brand-sage font-bold text-xl">
                      {selectedEmployee.name[0]}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-brand-navy">
                        {selectedEmployee.name}
                      </h2>
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
                        onBlur={(e) =>
                          router.put(`/dashboard/employees/${targetId}`, {
                            advisorNotes: e.target.value,
                          })
                        }
                      />
                    </div>
                    <Card className="p-10">
                      <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest mb-8">
                        Feuille de Route
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedEmployee.plan.map((step) => {
                          const result = getResultsForStep(step)
                          return (
                            <div
                              key={step.id}
                              onClick={() => router.visit(`/dashboard/conseiller/employees/${selectedEmployee.id}/steps/${step.id}`)}
                              className="group cursor-pointer p-6 rounded-[32px] border border-brand-navy/5 bg-brand-ivory/30 hover:bg-white hover:border-brand-sage/30 hover:shadow-xl transition-all flex flex-col justify-between"
                            >
                              <div className="mb-4">
                                <div className="flex justify-between items-start mb-4">
                                  <div
                                    className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                                      step.completed
                                        ? 'bg-brand-sage/20 text-brand-sage'
                                        : 'bg-brand-navy/10 text-brand-navy/40'
                                    }`}
                                  >
                                    {step.completed ? 'Validée' : 'À faire'}
                                  </div>
                                </div>
                                <h4 className="font-bold text-brand-navy text-lg group-hover:text-brand-sage">
                                  {step.title}
                                </h4>
                              </div>
                              {result && (
                                <div className="pt-4 border-t border-brand-navy/5 flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-brand-sage uppercase tracking-widest">
                                    Rapport Gemini →
                                  </span>
                                </div>
                              )}
                            </div>
                          )
                        })}
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
                              <span className="text-[9px] font-bold text-brand-sage">
                                {s.level}/5
                              </span>
                            </div>
                            <div className="h-1 bg-brand-navy/5 rounded-full w-full">
                              <div
                                className="h-full bg-brand-sage rounded-full"
                                style={{ width: `${(s.level / 5) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          {isAddModalOpen && <AddEmployeeModal onClose={() => setIsAddModalOpen(false)} />}
        </div>
      ) : selectedEmployee && !selectedEmployee.onboarded ? (
        <OnboardingFlow
          employee={selectedEmployee}
          onComplete={(updated) => {
            router.put(`/dashboard/employees/${targetId}`, employeeUpdatePayload(updated) as any, {
              onSuccess: () => router.reload(),
            })
          }}
        />
      ) : selectedEmployee ? (
        <div className="space-y-8 animate-fadeIn w-full">
          <div className="bg-brand-navy p-10 md:p-14 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-sage/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Hello, {selectedEmployee.name.split(' ')[0]} 🚀
              </h2>
              <p className="text-white/60 text-lg opacity-90 max-w-xl">
                Votre transition vers{' '}
                <span className="text-white font-bold">{selectedEmployee.targetRole}</span> est
                boostée à l'IA.
              </p>
              <Button
                onClick={() => setActiveView('profile-edit')}
                variant="outline"
                className="mt-10 bg-white text-brand-navy border-none"
                size="lg"
              >
                Mon Profil Vitaminé
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <Card className="p-10">
                <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-[0.2em] mb-8">
                  Ma Feuille de Route
                </h3>
                <div className="space-y-10">
                  {selectedEmployee.plan.map((step, idx) => (
                    <div key={step.id} className="relative flex items-start group">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                          step.completed
                            ? 'bg-brand-sage text-white shadow-lg shadow-brand-sage/20'
                            : 'bg-white border-2 border-brand-navy/5 text-brand-navy/20'
                        }`}
                      >
                        {step.completed ? '✓' : idx + 1}
                      </div>
                      <div className="ml-8 grow pb-10 border-l-2 border-brand-navy/5 -ml-5 pl-5 last:border-transparent">
                        <h4
                          className={`font-bold text-xl ${
                            step.completed ? 'text-brand-navy/40' : 'text-brand-navy'
                          }`}
                        >
                          {step.title}
                        </h4>
                        <p className="text-brand-navy/60 mt-2 text-sm">{step.description}</p>
                        {step.associatedExercises && step.associatedExercises.length > 0 && !step.completed && (
                          <div className="mt-6 flex flex-wrap gap-2">
                            {step.associatedExercises.map((exerciseType) => (
                              <Button
                                key={exerciseType}
                                onClick={() => {
                                  setCurrentTool(exerciseType)
                                  setActiveView('exercise')
                                }}
                                variant="secondary"
                                size="sm"
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
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                      />
                                    </svg>
                                  }
                                >
                                  {exerciseType.replace(/_/g, ' ')}
                                </Button>
                              ))}
                            </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            <div className="lg:col-span-4 space-y-8">
              {selectedEmployee.advisorNotes && (
                <div className="bg-brand-sage/5 p-8 rounded-[40px] border border-brand-sage/10 shadow-sm">
                  <h3 className="text-sm font-bold text-brand-sage uppercase tracking-widest mb-4">
                    Conseils Expert
                  </h3>
                  <p className="text-brand-navy/80 text-sm font-medium italic">
                    &quot;{selectedEmployee.advisorNotes}&quot;
                  </p>
                </div>
              )}
              <Card className="p-8">
                <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest mb-6">
                  Expertises
                </h3>
                <div className="space-y-4">
                  {selectedEmployee.skills.slice(0, 5).map((s, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-brand-navy/60 uppercase">
                        <span>{s.name}</span>
                        <span className="text-brand-sage">{s.level}/5</span>
                      </div>
                      <div className="h-1.5 bg-brand-navy/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-sage rounded-full"
                          style={{ width: `${(s.level / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  )
}

export default AppShell
