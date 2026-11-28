import {
  QUALITATIVE_ANALYSIS_STATUSES,
  type QualitativeAnalysisStatus,
} from '#shared/constants/exercises'
import { router } from '@inertiajs/react'
import { useState } from 'react'
import Button from '~/components/ui/Button'

type Props = {
  employeeId: string | number
  /** Slug de l'exercice (`values`, `disc`…). */
  type: string
  status?: QualitativeAnalysisStatus | null
  className?: string
}

/**
 * État de l'analyse IA côté conseiller (#171) : « en cours » pendant les essais
 * du job, échec définitif avec relance manuelle. Rien quand l'analyse est
 * terminée ou n'a pas été demandée.
 */
export function QualitativeAnalysisStatusNotice({
  employeeId,
  type,
  status,
  className = '',
}: Props) {
  const [processing, setProcessing] = useState(false)

  if (status === QUALITATIVE_ANALYSIS_STATUSES.PENDING) {
    return (
      <p
        role="status"
        className={`rounded-xl bg-info-soft px-4 py-3 text-sm text-info ${className}`}
      >
        Analyse IA en cours de génération. Elle apparaîtra ici dès qu’elle sera prête.
      </p>
    )
  }

  if (status !== QUALITATIVE_ANALYSIS_STATUSES.FAILED) return null

  return (
    <div
      role="alert"
      className={`flex flex-col gap-3 rounded-xl bg-danger-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <p className="text-sm text-danger">
        L’analyse IA n’a pas pu être générée après plusieurs essais (fournisseur IA indisponible).
      </p>
      <Button
        variant="outline"
        size="sm"
        isLoading={processing}
        disabled={processing}
        onClick={() => {
          router.post(
            `/dashboard/conseiller/employees/${employeeId}/exercises/results/${type}/analysis/retry`,
            {},
            {
              preserveScroll: true,
              onStart: () => setProcessing(true),
              onFinish: () => setProcessing(false),
            }
          )
        }}
      >
        Relancer l’analyse
      </Button>
    </div>
  )
}
