import { EmployeeData } from '../../types/Employee'
import { formatDateTimeFR } from '#shared/helpers/date'
import AppLink from '../ui/AppLink'
import Button from '../ui/Button'
import Card from '../ui/Card'

export default function EmployeeHome({
  employee,
}: {
  employee: EmployeeData
}) {
  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-2 border-brand-sage border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fadeIn w-full">
      <div className="bg-brand-navy p-10 md:p-14 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-sage/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Hello, {employee.name.split(' ')[0]} 🚀
          </h2>
          <p className="text-white/60 text-lg opacity-90 max-w-xl">
            Votre transition vers{' '}
            <span className="text-white font-bold">{employee.targetRole}</span> est boostée
            à l'IA.
          </p>
          <AppLink href="/dashboard/candidat/profile">
            <Button
              variant="outline"
              className="mt-10 bg-white text-brand-navy border-none"
              size="lg"
            >
              Mon Profil Vitaminé
            </Button>
          </AppLink>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card className="p-10">
            <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-[0.2em] mb-8">
              Ma Feuille de Route
            </h3>
            <div className="space-y-10">
              {employee.plan.map((step, idx) => {
                const isLocked = step.isLocked && !step.completed
                return (
                  <div key={step.id} className="relative flex items-start group">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                        step.completed
                          ? 'bg-brand-sage text-white shadow-lg shadow-brand-sage/20'
                          : isLocked
                          ? 'bg-amber-100 border-2 border-amber-200 text-amber-600'
                          : 'bg-white border-2 border-brand-navy/5 text-brand-navy/20'
                      }`}
                    >
                      {step.completed ? (
                        '✓'
                      ) : isLocked ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <div className="ml-3 grow pb-10 border-l-2 border-brand-navy/5 pl-5 last:border-transparent">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`font-bold text-xl ${
                            step.completed
                              ? 'text-brand-navy/40'
                              : isLocked
                              ? 'text-brand-navy/60'
                              : 'text-brand-navy'
                          }`}
                        >
                          RDV {(step.sortOrder ?? idx) + 1}
                        </h4>
                        {isLocked && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-amber-100 text-amber-600">
                            Verrouillée
                          </span>
                        )}
                      </div>
                      {step.scheduledAt && (
                        <p className="text-brand-terracotta font-medium mt-1 text-sm">
                          {formatDateTimeFR(step.scheduledAt)}
                        </p>
                      )}
                      {step.instructions && (
                        <p className="text-brand-navy/60 mt-2 text-sm">{step.instructions}</p>
                      )}

                      {isLocked && (
                        <div className="mt-6 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-3 rounded-xl">
                          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>Cette étape sera débloquée par votre conseiller</span>
                        </div>
                      )}

                      {step.associatedExercises &&
                        step.associatedExercises.length > 0 &&
                        !step.completed && (
                          <div className="mt-6 flex flex-wrap gap-2">
                            {step.associatedExercises.map((exerciseType) => {
                              const exerciseLabel = exerciseType.replace(/_/g, ' ')

                              if (isLocked) {
                                return (
                                  <Button
                                    key={exerciseType}
                                    variant="secondary"
                                    size="sm"
                                    disabled
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
                                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                      </svg>
                                    }
                                  >
                                    {exerciseLabel}
                                  </Button>
                                )
                              }

                              return (
                                <AppLink
                                  key={exerciseType}
                                  href={`/dashboard/candidat/exercises/${exerciseType.toLowerCase()}`}
                                >
                                  <Button
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
                                    {exerciseLabel}
                                  </Button>
                                </AppLink>
                              )
                            })}
                          </div>
                        )}
                      {step.completed && (
                        <AppLink href={`/dashboard/candidat/steps/${step.id}`}>
                          <Button
                            className="mt-6"
                            variant="outline"
                            size="sm"
                          >
                            Voir le résultat →
                          </Button>
                        </AppLink>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-8 pt-8 border-t border-brand-navy/5">
              <AppLink
                href="/dashboard/candidat/exercises"
                className="text-brand-sage font-semibold text-sm hover:underline"
              >
                Voir tous les exercices →
              </AppLink>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-4 space-y-8">
          {employee.advisorNotes && (
            <div className="bg-brand-sage/5 p-8 rounded-[40px] border border-brand-sage/10 shadow-sm">
              <h3 className="text-sm font-bold text-brand-sage uppercase tracking-widest mb-4">
                Conseils Expert
              </h3>
              <p className="text-brand-navy/80 text-sm font-medium italic">
                &quot;{employee.advisorNotes}&quot;
              </p>
            </div>
          )}
          <Card className="p-8">
            <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest mb-6">
              Expertises
            </h3>
            <div className="space-y-4">
              {employee.skills.slice(0, 5).map((s, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-brand-navy/60 uppercase">
                    <span>{s.name}</span>
                    <span className="text-brand-sage">{s.level}/5</span>
                  </div>
                  <div className="h-1.5 bg-brand-navy/5 rounded-full overflow-hidden">
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
  )
}
