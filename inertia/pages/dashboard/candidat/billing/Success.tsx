import { Head, router } from '@inertiajs/react'
import { CheckCircle2, Clock } from 'lucide-react'
import { useEffect } from 'react'
import { BILLING_PATHS } from '#shared/constants/billing'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName } from '~/components/ui/Button'
import Card from '~/components/ui/Card'
import { Eyebrow } from '~/components/ui/Eyebrow'

interface SuccessPageProps {
  /** Paiement confirmé à la réconciliation ; sinon la confirmation arrive par le webhook. */
  paid: boolean
}

/** Nombre maximal de rechargements de la prop `paid` en attendant le webhook. */
export const PAYMENT_POLL_MAX_ATTEMPTS = 5
const PAYMENT_POLL_INTERVAL_MS = 3000

/** Retour de Stripe Checkout (#102). */
export default function CheckoutSuccessPage({ paid }: SuccessPageProps) {
  useEffect(() => {
    if (paid) return
    let attempts = 0
    const timer = setInterval(() => {
      attempts += 1
      router.reload({ only: ['paid'] })
      if (attempts >= PAYMENT_POLL_MAX_ATTEMPTS) clearInterval(timer)
    }, PAYMENT_POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [paid])

  return (
    <DashboardLayout>
      <Head title={paid ? 'Paiement confirmé' : 'Paiement en cours'} />
      <div className="mx-auto w-full max-w-2xl animate-fade-in">
        {paid ? (
          <Card variant="accent" className="space-y-4" role="status">
            <Eyebrow icon={<CheckCircle2 className="h-4 w-4" />}>Paiement confirmé</Eyebrow>
            <h1 className="font-display text-display-sm text-ink">
              Merci, vos résultats sont débloqués
            </h1>
            <p className="text-base text-ink-soft">
              Tous les exercices, leurs analyses IA et votre synthèse sont désormais accessibles.
              Votre facture vous est envoyée par e-mail.
            </p>
            <div className="flex flex-wrap gap-3">
              <AppLink
                href={BILLING_PATHS.home}
                className={buttonClassName({ variant: 'primary' })}
              >
                Reprendre mon parcours
              </AppLink>
              <AppLink
                href={BILLING_PATHS.synthesis}
                className={buttonClassName({ variant: 'outline' })}
              >
                Voir ma synthèse
              </AppLink>
            </div>
          </Card>
        ) : (
          <Card variant="sun" className="space-y-4" role="status">
            <Eyebrow tone="muted" icon={<Clock className="h-4 w-4" />}>
              Paiement en cours
            </Eyebrow>
            <h1 className="font-display text-display-sm text-ink">
              Votre paiement est en cours de confirmation
            </h1>
            <p className="text-base text-ink-soft">
              Stripe nous confirme le paiement d’ici quelques instants : vos résultats seront
              débloqués automatiquement. Rechargez cette page ou revenez à votre espace.
            </p>
            <div className="flex flex-wrap gap-3">
              <AppLink
                href={BILLING_PATHS.home}
                className={buttonClassName({ variant: 'primary' })}
              >
                Retour à mon espace
              </AppLink>
              <AppLink
                href={BILLING_PATHS.offer}
                className={buttonClassName({ variant: 'outline' })}
              >
                Revoir l’offre
              </AppLink>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
