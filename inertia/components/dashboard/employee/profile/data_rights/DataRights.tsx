import { formatDateTimeFR } from '#shared/helpers/date'
import type { CandidateDataRights } from '#shared/types/candidate_data/requests'
import { router } from '@inertiajs/react'
import { useState } from 'react'
import Button from '~/components/ui/Button'
import ConfirmModal from '~/components/ui/ConfirmModal'

export const CANDIDATE_DATA_EXPORT_URL = '/dashboard/candidat/data/export'
export const CANDIDATE_ERASURE_REQUEST_URL = '/dashboard/candidat/data/erasure-request'

interface DataRightsProps {
  rights: CandidateDataRights
}

/**
 * Droits RGPD du candidat en libre-service (#70) : télécharger ses données
 * (archive ZIP) et demander leur effacement, traité par l'équipe sous un mois.
 */
export function DataRights({ rights }: DataRightsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [processing, setProcessing] = useState(false)

  const requestErasure = () => {
    router.post(
      CANDIDATE_ERASURE_REQUEST_URL,
      {},
      {
        preserveScroll: true,
        onStart: () => setProcessing(true),
        onFinish: () => {
          setProcessing(false)
          setConfirmOpen(false)
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm text-brand-navy/70">
          Téléchargez une archive de vos données : profil, exercices et synthèse en PDF, données
          brutes (JSON) et documents déposés.
        </p>
        {/* Téléchargement de fichier (ZIP) : ancre native, pas une navigation Inertia. */}
        <a
          href={CANDIDATE_DATA_EXPORT_URL}
          download
          className="inline-flex items-center justify-center rounded-xl border border-brand-navy/15 px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-navy/5 transition-colors"
        >
          Télécharger mes données
        </a>
      </div>

      <div className="space-y-3 pt-6 border-t border-brand-navy/5">
        {rights.erasureRequestedAt ? (
          <p role="status" className="text-sm text-brand-navy">
            Demande d’effacement envoyée le {formatDateTimeFR(rights.erasureRequestedAt)}. Elle sera
            traitée sous un mois ; vous serez prévenu par e-mail.
          </p>
        ) : (
          <>
            <p className="text-sm text-brand-navy/70">
              Vous pouvez demander l’effacement de votre compte et de toutes vos données. La
              suppression est définitive ; votre demande est traitée sous un mois.
            </p>
            <Button type="button" variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
              Demander l’effacement de mes données
            </Button>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Demander l’effacement de vos données ?"
        description="Votre compte, votre parcours, vos exercices et vos documents seront définitivement supprimés une fois la demande traitée."
        variant="danger"
        state={processing ? 'loading' : 'idle'}
        confirmLabel="Envoyer la demande"
        cancelLabel="Annuler"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={requestErasure}
      />
    </div>
  )
}
