import { Head } from '@inertiajs/react'
import { UserRound } from 'lucide-react'
import {
  EXPERT_REQUEST_STATUSES,
  EXPERT_SUPPORT_LOCK_REASONS,
} from '#shared/constants/expert_request'
import type { ExpertSupportView } from '#shared/types/expert_request/views'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import { ExpertRequestForm } from '~/components/dashboard/b2c/ExpertRequestForm'
import { ExpertRequestStatus } from '~/components/dashboard/b2c/ExpertRequestStatus'
import { ResultsLockedCard } from '~/components/dashboard/b2c/ResultsLockedCard'
import AppLink from '~/components/ui/AppLink'
import Card from '~/components/ui/Card'
import { Eyebrow } from '~/components/ui/Eyebrow'

interface ExpertSupportPageProps {
  support: ExpertSupportView
}

/** Page « Être accompagné par un expert » (#103). */
export default function ExpertSupportPage({ support }: ExpertSupportPageProps) {
  const canRequest =
    support.eligible &&
    !support.expert &&
    (!support.request || support.request.status !== EXPERT_REQUEST_STATUSES.PENDING)

  return (
    <DashboardLayout>
      <Head title="Accompagnement par un expert" />
      <div className="mx-auto w-full max-w-3xl space-y-6 animate-fade-in">
        <AppLink
          href="/dashboard/candidat"
          className="text-sm font-medium text-accent hover:underline"
        >
          ← Retour à mon espace
        </AppLink>
        <div className="space-y-2">
          <Eyebrow icon={<UserRound className="h-4 w-4" />}>Accompagnement</Eyebrow>
          <h1 className="font-display text-display-sm text-ink">Être accompagné par un expert</h1>
          <p className="text-base text-ink-soft">
            Un expert de la plateforme peut suivre votre parcours : relire vos résultats, proposer
            des étapes et vous aider à construire votre plan.
          </p>
        </div>

        {support.lockedReason === EXPERT_SUPPORT_LOCK_REASONS.B2B && (
          <Card variant="flat" role="status">
            <p className="text-sm text-ink-soft">
              Votre accompagnement est assuré par votre conseiller : il voit votre parcours et vous
              propose les étapes.
            </p>
          </Card>
        )}

        {support.lockedReason === EXPERT_SUPPORT_LOCK_REASONS.PAYMENT && (
          <ResultsLockedCard
            title="L’accompagnement par un expert est réservé au forfait"
            description="Réglez le forfait pour débloquer vos résultats et demander un expert."
          />
        )}

        {support.expert && (
          <Card variant="accent" className="flex items-start gap-4" role="status">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-accent"
              aria-hidden="true"
            >
              <UserRound className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <h2 className="text-title-sm text-ink">Votre expert : {support.expert.name}</h2>
              <p className="text-sm text-ink-soft">
                Il suit votre parcours et peut vous proposer des étapes et des notes.
              </p>
            </div>
          </Card>
        )}

        {support.request && !support.expert && (
          <ExpertRequestStatus request={support.request} expert={support.expert} />
        )}

        {canRequest && <ExpertRequestForm />}
      </div>
    </DashboardLayout>
  )
}
