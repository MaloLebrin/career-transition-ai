import { Head, router } from '@inertiajs/react'
import { useCallback, useMemo, useState } from 'react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import AppLink from '~/components/ui/AppLink'
import Button from '~/components/ui/Button'
import Card from '~/components/ui/Card'
import { EXERCISE_LIST, EXERCISE_SLUGS } from '~/config/exercises'
import type { Employee } from '~/types/employee'

type SynthesisProps = {
  employeeId: string
  employee: Employee
  synthesis: {
    shareStatus: 'draft' | 'shared'
    sharedAt: string | null
    expertCommentsShared: string | null
    expertNotesInternal: string | null
    executiveSummaryOverride: string | null
  }
  latestCompletedByType: Record<string, number>
}

export default function EmployeeSynthesisPage({
  employeeId,
  employee,
  synthesis,
  latestCompletedByType,
}: SynthesisProps) {
  const [saving, setSaving] = useState(false)
  const [expertCommentsShared, setExpertCommentsShared] = useState(synthesis.expertCommentsShared ?? '')
  const [expertNotesInternal, setExpertNotesInternal] = useState(synthesis.expertNotesInternal ?? '')
  const [executiveSummaryOverride, setExecutiveSummaryOverride] = useState(
    synthesis.executiveSummaryOverride ?? ''
  )

  const isShared = synthesis.shareStatus === 'shared'

  const latestResults = useMemo(() => {
    const byType = new Map<string, typeof employee.exercises[0]>()
    for (const res of employee.exercises) {
      const key = (res.type as string).toLowerCase()
      const existing = byType.get(key)
      if (!existing || (res.date && (!existing.date || res.date > existing.date))) {
        byType.set(key, res)
      }
    }
    return Array.from(byType.values())
  }, [employee.exercises])

  const handleSave = useCallback(() => {
    setSaving(true)
    router.put(
      `/dashboard/conseiller/employees/${employeeId}/synthesis`,
      {
        expertCommentsShared: expertCommentsShared || null,
        expertNotesInternal: expertNotesInternal || null,
        executiveSummaryOverride: executiveSummaryOverride || null,
      },
      {
        preserveScroll: true,
        onFinish: () => setSaving(false),
      }
    )
  }, [employeeId, expertCommentsShared, expertNotesInternal, executiveSummaryOverride])

  const handleShareToggle = useCallback(() => {
    router.post(
      `/dashboard/conseiller/employees/${employeeId}/synthesis/${isShared ? 'unshare' : 'share'}`,
      {},
      { preserveScroll: true }
    )
  }, [employeeId, isShared])

  return (
    <DashboardLayout selectedEmployeeId={employeeId}>
      <Head title={`Synthèse - ${employee.name}`} />

      <div className="space-y-6">
        <Card className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-brand-navy/40">
              Synthèse
            </div>
            <div className="text-2xl font-bold text-brand-navy">{employee.name}</div>
            <div className="text-sm text-brand-navy/60">{employee.currentRole}</div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <AppLink href={`/dashboard/conseiller/employees/${employeeId}`}>
              <Button variant="outline" size="sm">Retour</Button>
            </AppLink>
            <Button variant={isShared ? 'outline' : 'dark'} size="sm" onClick={handleShareToggle}>
              {isShared ? 'Désactiver le partage' : 'Partager au talent'}
            </Button>
            <a
              href={`/dashboard/conseiller/employees/${employeeId}/synthesis/pdf`}
              className="inline-flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-2 border-brand-navy/10 text-brand-navy/60 hover:border-brand-navy hover:text-brand-navy px-4 py-2 text-sm rounded-xl gap-2"
              aria-disabled={!isShared}
              onClick={(e) => {
                if (!isShared) e.preventDefault()
              }}
              title={!isShared ? 'Partager la synthèse pour activer l’export' : 'Exporter PDF partageable'}
            >
              Export PDF
            </a>
            <Button variant="dark" size="sm" onClick={handleSave} isLoading={saving}>
              Enregistrer
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6">
              <h3 className="text-sm font-bold text-brand-sage uppercase tracking-widest mb-3">
                Commentaires partageables (talent + PDF)
              </h3>
              <textarea
                className="w-full bg-white/50 border border-brand-sage/10 rounded-3xl p-5 text-sm min-h-[140px] outline-none focus:ring-2 focus:ring-brand-sage transition-all resize-none"
                value={expertCommentsShared}
                onChange={(e) => setExpertCommentsShared(e.target.value)}
                placeholder="Message au talent, recommandations, angles de lecture…"
              />
              <div className="mt-3 text-xs text-brand-navy/50">
                Statut partage: <span className="font-bold">{isShared ? 'Partagé' : 'Brouillon'}</span>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest mb-3">
                Résumé exécutif (optionnel)
              </h3>
              <textarea
                className="w-full bg-white/50 border border-brand-navy/10 rounded-3xl p-5 text-sm min-h-[120px] outline-none focus:ring-2 focus:ring-brand-sage transition-all resize-none"
                value={executiveSummaryOverride}
                onChange={(e) => setExecutiveSummaryOverride(e.target.value)}
                placeholder="Si rempli, ce texte remplacera le résumé auto."
              />
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest mb-3">
                Résultats (derniers complétés par type)
              </h3>
              {latestResults.length === 0 ? (
                <p className="text-sm text-brand-navy/60">Aucun exercice complété pour l’instant.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {latestResults.map((res) => {
                    const slug =
                      EXERCISE_SLUGS[res.type as keyof typeof EXERCISE_SLUGS] ??
                      (res.type as string).toLowerCase()
                    const title =
                      EXERCISE_LIST.find((e) => e.slug === slug)?.title ?? (res.type as string)
                    const isLatestCompleted = Boolean(latestCompletedByType[(res.type as string).toLowerCase()])
                    return (
                      <AppLink
                        key={res.id}
                        href={`/dashboard/conseiller/employees/${employeeId}/exercises/results/${slug}`}
                        className="block p-4 rounded-2xl border border-brand-navy/5 bg-brand-ivory/30 hover:bg-white hover:border-brand-sage/30 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-brand-navy">{title}</div>
                            <div className="text-xs text-brand-navy/60 mt-1">
                              Score: {res.quantitativeScore ?? 0}
                            </div>
                          </div>
                          <div className="text-[9px] font-bold uppercase tracking-widest text-brand-sage">
                            {isLatestCompleted ? 'Dernier' : ''}
                          </div>
                        </div>
                      </AppLink>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6">
              <h3 className="text-sm font-bold text-brand-terracotta uppercase tracking-widest mb-3">
                Notes internes (expert uniquement)
              </h3>
              <textarea
                className="w-full bg-white/50 border border-brand-terracotta/20 rounded-3xl p-5 text-sm min-h-[220px] outline-none focus:ring-2 focus:ring-brand-terracotta transition-all resize-none"
                value={expertNotesInternal}
                onChange={(e) => setExpertNotesInternal(e.target.value)}
                placeholder="Préparation d’entretien, hypothèses, zones à creuser…"
              />
              <div className="mt-3 text-xs text-brand-navy/50">
                Ces notes ne seront jamais visibles côté talent ni dans le PDF partageable.
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

