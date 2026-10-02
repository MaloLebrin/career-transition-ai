import { router } from '@inertiajs/react'
import { useState } from 'react'
import { BILLING_ADMIN_PATHS } from '#shared/constants/billing'
import { formatDateTimeFR } from '#shared/helpers/date'
import type { B2cCandidateRow } from '#shared/types/billing/admin'
import Badge from '~/components/ui/Badge'
import Button from '~/components/ui/Button'
import Card from '~/components/ui/Card'
import ConfirmModal from '~/components/ui/ConfirmModal'

interface B2cCandidatesTableProps {
  candidates: B2cCandidateRow[]
}

/** Particuliers inscrits (#107) : droit, expert, demande en attente, octroi manuel d'un accès. */
export function B2cCandidatesTable({ candidates }: B2cCandidatesTableProps) {
  const [pending, setPending] = useState<B2cCandidateRow | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const confirmGrant = () => {
    if (!pending || submitting) return
    setSubmitting(true)
    router.post(
      BILLING_ADMIN_PATHS.grant(pending.id),
      {},
      {
        preserveScroll: true,
        onFinish: () => {
          setSubmitting(false)
          setPending(null)
        },
      }
    )
  }

  if (candidates.length === 0) {
    return (
      <Card variant="flat" role="status">
        <p className="text-sm text-muted">Aucun particulier inscrit pour le moment.</p>
      </Card>
    )
  }

  return (
    <>
      <Card padding="none">
        <table className="w-full text-sm" aria-label="Particuliers inscrits">
          <thead>
            <tr className="border-b border-hairline text-left text-muted">
              <th scope="col" className="px-5 py-3 font-medium">
                Particulier
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                Inscription
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                Forfait
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                Expert
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr key={candidate.id} className="border-b border-hairline last:border-b-0">
                <td className="px-5 py-3">
                  <div className="font-medium text-ink">{candidate.name}</div>
                  <div className="text-muted">
                    {candidate.email}
                    {!candidate.emailVerified && ' · e-mail non vérifié'}
                  </div>
                </td>
                <td className="px-5 py-3 text-ink-soft">
                  {candidate.createdAt ? formatDateTimeFR(candidate.createdAt) : '—'}
                </td>
                <td className="px-5 py-3">
                  <Badge variant={candidate.hasPaidAccess ? 'success' : 'neutral'} dot>
                    {candidate.hasPaidAccess ? 'Réglé' : 'Gratuit'}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-ink-soft">
                  {candidate.expert?.name ??
                    (candidate.pendingExpertRequest ? 'Demande en attente' : '—')}
                </td>
                <td className="px-5 py-3 text-right">
                  {!candidate.hasPaidAccess && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPending(candidate)}
                    >
                      Ouvrir l’accès
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ConfirmModal
        isOpen={pending !== null}
        title="Ouvrir l’accès au forfait"
        description={
          pending
            ? `Un paiement manuel à 0 € sera enregistré pour ${pending.name} : résultats débloqués, analyses IA lancées, particulier prévenu.`
            : undefined
        }
        variant="success"
        state={submitting ? 'loading' : 'idle'}
        confirmLabel="Ouvrir l’accès"
        cancelLabel="Annuler"
        onCancel={() => !submitting && setPending(null)}
        onConfirm={confirmGrant}
      />
    </>
  )
}
