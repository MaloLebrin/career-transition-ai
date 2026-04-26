import { Head, router } from '@inertiajs/react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import Card from '~/components/ui/Card'
import Button from '~/components/ui/Button'
import type { Employee } from '~/types/employee'

type CandidateSynthesisProps =
  | {
      shared: false
      employeeId: string
      employee: null
      synthesis: null
      latestCompletedByType: Record<string, number>
      latestPdfJob: null
    }
  | {
      shared: true
      employeeId: string
      employee: Employee
      synthesis: {
        shareStatus: 'draft' | 'shared'
        sharedAt: string | null
        expertCommentsShared: string | null
        executiveSummaryOverride: string | null
      }
      latestCompletedByType: Record<string, number>
      latestPdfJob: null | {
        id: number
        status: string
        downloadUrl: string | null
      }
    }

export default function CandidateSynthesisPage(props: CandidateSynthesisProps) {
  if (!props.shared) {
    return (
      <DashboardLayout>
        <Head title="Synthèse" />
        <Card className="p-8">
          <div className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest">
            Synthèse
          </div>
          <div className="mt-2 text-brand-navy">
            Votre synthèse n’est pas encore partagée par votre expert.
          </div>
        </Card>
      </DashboardLayout>
    )
  }

  const { employee, synthesis } = props

  return (
    <DashboardLayout>
      <Head title="Synthèse" />
      <div className="space-y-6">
        <Card className="p-8">
          <div className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest">
            Synthèse partagée
          </div>
          <div className="mt-2 text-2xl font-bold text-brand-navy">{employee.name}</div>
          <div className="text-sm text-brand-navy/60">{employee.currentRole}</div>
          <div className="mt-4">
            {props.latestPdfJob?.downloadUrl ? (
              <a href={props.latestPdfJob.downloadUrl}>
                <Button variant="emphasis" size="sm">
                  Télécharger le PDF
                </Button>
              </a>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.post('/dashboard/candidat/synthesis/pdf')}
              >
                Générer le PDF (async)
              </Button>
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

        <Card className="p-8">
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

