import React, { useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLink from '../../components/ui/AppLink'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import Card from '../../components/ui/Card'
import { useAuth } from '../../hooks/useAuth'
import { useEmployee } from '../../hooks/useEmployee'
import type { Employee } from '../../types'

interface EmployeeProfileProps {
  employeeId: string
  employee: Employee
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}

export default function EmployeeProfile({ employeeId, employee }: EmployeeProfileProps) {
  const { user } = useAuth()
  const { employee: selectedEmployee } = useEmployee(employeeId, employee)
  const backHref = `/dashboard/conseiller/employees/${employeeId}`

  useEffect(() => {
    if (!user) router.visit('/auth/login')
  }, [user])

  if (!user) return null
  if (!selectedEmployee) {
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
      <Head title={`Profil - ${selectedEmployee.name}`} />
      <div className="animate-fadeIn max-w-4xl mx-auto space-y-10">
        <AppLink href={backHref} className="inline-flex items-center gap-2 text-brand-navy/70 hover:text-brand-navy text-sm font-medium transition-colors">
          <span>←</span>
          <span>Retour à la fiche candidat</span>
        </AppLink>

        {/* Hero candidat */}
        <div className="bg-brand-navy p-10 md:p-14 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-sage/10 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-8">
            <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center text-4xl font-bold text-brand-sage shrink-0">
              {selectedEmployee.name[0]}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {selectedEmployee.name}
              </h1>
              <p className="text-white/80 mt-2 text-lg">
                {selectedEmployee.currentRole}
                {selectedEmployee.targetRole && (
                  <>
                    <span className="text-white/50 mx-2">·</span>
                    <span className="text-brand-sage font-semibold">Objectif {selectedEmployee.targetRole}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Profil (coordonnées) */}
        <Card className="p-10 rounded-[40px]">
          <h2 className="text-sm font-bold text-brand-navy/40 uppercase tracking-[0.2em] mb-8">
            Profil
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-brand-navy/50 uppercase tracking-widest">Email</span>
              <a
                href={`mailto:${selectedEmployee.email}`}
                className="text-brand-sage font-semibold hover:underline"
              >
                {selectedEmployee.email}
              </a>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-brand-navy/50 uppercase tracking-widest">Poste actuel</span>
              <span className="text-brand-navy font-medium">{selectedEmployee.currentRole}</span>
            </div>
            {selectedEmployee.targetRole && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-navy/50 uppercase tracking-widest">Objectif</span>
                <span className="text-brand-navy font-medium">{selectedEmployee.targetRole}</span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-brand-navy/50 uppercase tracking-widest">Statut</span>
              <span className="text-brand-navy font-medium">
                {selectedEmployee.status === 'active' && 'Actif'}
                {selectedEmployee.status === 'completed' && 'Terminé'}
                {selectedEmployee.status === 'on-hold' && 'En pause'}
              </span>
            </div>
          </div>
        </Card>

        {selectedEmployee.summary && (
          <div className="bg-brand-sage/5 p-10 rounded-[40px] border border-brand-sage/10">
            <h2 className="text-sm font-bold text-brand-sage uppercase tracking-[0.2em] mb-6">
              Bref / Résumé
            </h2>
            <p className="text-brand-navy/90 leading-relaxed whitespace-pre-wrap text-base">
              {selectedEmployee.summary}
            </p>
          </div>
        )}

        {/* Expériences */}
        <Card className="p-10 rounded-[40px]">
          <h2 className="text-sm font-bold text-brand-navy/40 uppercase tracking-[0.2em] mb-8">
            Expériences
          </h2>
          {selectedEmployee.experiences.length === 0 ? (
            <p className="text-brand-navy/50 italic">Aucune expérience renseignée.</p>
          ) : (
            <ul className="space-y-10">
              {selectedEmployee.experiences.map((exp) => (
                <li key={exp.id} className="relative flex gap-6 pb-10 last:pb-0 border-b border-brand-navy/5 last:border-0">
                  <div className="w-12 h-12 rounded-2xl bg-brand-sage/10 flex items-center justify-center shrink-0">
                    <span className="text-brand-sage font-bold text-sm">XP</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="text-xl font-bold text-brand-navy">{exp.title}</h3>
                      {exp.type && (
                        <span className="text-xs font-bold text-brand-navy/40 uppercase px-2 py-0.5 rounded-full bg-brand-navy/5">
                          {exp.type}
                        </span>
                      )}
                    </div>
                    <p className="text-brand-sage font-semibold mt-1">{exp.company}</p>
                    <p className="text-brand-navy/50 text-sm mt-1">
                      {formatDate(exp.startDate)}
                      {exp.endDate && ` – ${exp.isCurrent ? 'aujourd\'hui' : formatDate(exp.endDate)}`}
                    </p>
                    {exp.description && (
                      <p className="text-brand-navy/70 mt-4 leading-relaxed">
                        {exp.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Formations */}
        <Card className="p-10 rounded-[40px]">
          <h2 className="text-sm font-bold text-brand-navy/40 uppercase tracking-[0.2em] mb-8">
            Formations
          </h2>
          {selectedEmployee.educations.length === 0 ? (
            <p className="text-brand-navy/50 italic">Aucune formation renseignée.</p>
          ) : (
            <ul className="space-y-8">
              {selectedEmployee.educations.map((edu) => (
                <li key={edu.id} className="pb-8 last:pb-0 border-b border-brand-navy/5 last:border-0">
                  <h3 className="text-lg font-bold text-brand-navy">{edu.degree}</h3>
                  <p className="text-brand-navy/70 mt-1">{edu.school}</p>
                  <p className="text-brand-navy/50 text-sm mt-1">
                    {formatDate(edu.startDate)}
                    {edu.endDate && ` – ${edu.isCurrent ? 'aujourd\'hui' : formatDate(edu.endDate)}`}
                  </p>
                  {edu.description && (
                    <p className="text-brand-navy/60 mt-3 leading-relaxed text-sm">
                      {edu.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Compétences */}
        <Card className="p-10 rounded-[40px]">
          <h2 className="text-sm font-bold text-brand-navy/40 uppercase tracking-[0.2em] mb-8">
            Compétences
          </h2>
          {selectedEmployee.skills.length === 0 ? (
            <p className="text-brand-navy/50 italic">Aucune compétence renseignée.</p>
          ) : (
            <div className="space-y-5">
              {selectedEmployee.skills.map((s, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-brand-navy font-medium min-w-[160px]">{s.name}</span>
                  <div className="flex-1 h-3 bg-brand-navy/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-sage rounded-full transition-all"
                      style={{ width: `${(s.level / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-brand-navy/60 tabular-nums w-8">{s.level}/5</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
