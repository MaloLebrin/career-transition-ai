import type { ExerciseLockReason } from '#shared/constants/b2c'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import { Head, router } from '@inertiajs/react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import { ResultsLockedCard } from '~/components/dashboard/b2c/ResultsLockedCard'
import Card from '~/components/ui/Card'
import Button from '~/components/ui/Button'
import { useLivePdfExport, type LivePdfExport } from '~/hooks/use_live_pdf_export'
import type { Employee } from '~/types/employee'

type CandidateSynthesisProps =
  | {
      shared: false
      /** `payment` (#101) : particulier dont le forfait n'est pas réglé ; `null` : pas encore partagée. */
      lockedReason?: ExerciseLockReason | null
      employeeId: string
      employee: null
      synthesis: null
      latestCompletedByType: Record<string, number>
      latestPdfJob: null
    }
  | {
      shared: true
      lockedReason?: null
      employeeId: string
      employee: Employee
      synthesis: {
        shareStatus: 'draft' | 'shared'
        sharedAt: string | null
        expertCommentsShared: string | null
        executiveSummaryOverride: string | null
      }
      latestCompletedByType: Record<string, number>
      latestPdfJob: LivePdfExport
    }

export default function CandidateSynthesisPage(props: CandidateSynthesisProps) {
  if (!props.shared) {
    if (props.lockedReason === 'payment') {
      return (
        <DashboardLayout>
          <Head title="Synthèse" />
          <ResultsLockedCard
            title="Votre synthèse est réservée au forfait"
            description="La synthèse rassemble vos résultats, vos analyses IA et les commentaires de votre expert. Elle se débloque avec le forfait."
          />
        </DashboardLayout>
      )
    }
    return (
      <DashboardLayout>
        <Head title="Synthèse" />
        <Card className="p-8">
          <div className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest">
            Synthèse
          </div>
          <div className="mt-2 text-brand-navy">
            Votre synthèse n’est pas encore partagée par votre expert. Vous recevrez une
            notification dès qu’elle sera disponible.
          </div>
        </Card>
      </DashboardLayout>
    )
  }

  return <SharedSynthesis {...props} />
}

function SharedSynthesis({
  employeeId,
  employee,
  synthesis,
  latestPdfJob,
}: Extract<CandidateSynthesisProps, { shared: true }>) {
  // Statut du PDF poussé par Transmit : pas besoin de recharger la page (#70).
  const pdfJob = useLivePdfExport(employeeId, latestPdfJob)
  const pdfInProgress =
    pdfJob?.status === PDF_EXPORT_STATUSES.PENDING ||
    pdfJob?.status === PDF_EXPORT_STATUSES.PROCESSING

  return (
    <DashboardLayout>
      <Head title="Synthèse" />
      <div className="space-y-6">
        <Card className="p-8 border-t-[3px] border-t-brand-sage">
          <div className="text-sm font-bold text-brand-sage uppercase tracking-widest">
            {synthesis.shareStatus === 'shared' ? 'Synthèse partagée' : 'Votre synthèse'}
          </div>
          <div className="mt-2 text-2xl font-bold text-brand-navy">{employee.name}</div>
          <div className="text-sm text-brand-navy/60">{employee.currentRole}</div>
          <div className="mt-4">
            {pdfJob?.downloadUrl ? (
              <a
                href={pdfJob.downloadUrl}
                className="inline-flex items-center justify-center rounded-xl bg-brand-sage px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Télécharger le PDF
              </a>
            ) : pdfInProgress ? (
              <p role="status" className="text-sm text-brand-navy/70">
                Génération du PDF en cours… Le lien apparaîtra ici dès qu’il sera prêt.
              </p>
            ) : (
              <div className="space-y-2">
                {pdfJob?.status === PDF_EXPORT_STATUSES.FAILED && (
                  <p role="alert" className="text-sm text-rose-600 font-medium">
                    La génération du PDF a échoué. Vous pouvez réessayer.
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.post('/dashboard/candidat/synthesis/pdf', {}, { preserveScroll: true })
                  }
                >
                  Générer le PDF
                </Button>
              </div>
            )}
          </div>
        </Card>

        {synthesis.executiveSummaryOverride && (
          <Card className="p-8">
            <div className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest mb-3">
              Résumé
            </div>
            <div className="text-sm text-brand-navy whitespace-pre-wrap">
              {synthesis.executiveSummaryOverride}
            </div>
          </Card>
        )}

        <Card variant="sage" className="p-8">
          <div className="text-sm font-bold text-brand-sage uppercase tracking-widest mb-3">
            Commentaires de votre expert
          </div>
          <div className="text-sm text-brand-navy whitespace-pre-wrap">
            {synthesis.expertCommentsShared || 'Aucun commentaire partagé pour le moment.'}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
