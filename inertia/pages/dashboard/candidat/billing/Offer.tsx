import { Head } from '@inertiajs/react'
import { CheckCircle2, Sparkles } from 'lucide-react'
import { formatPrice } from '#shared/helpers/billing/format_price'
import type { OfferView } from '#shared/types/billing/checkout'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import { EmailVerificationBanner } from '~/components/dashboard/EmailVerificationBanner'
import { CheckoutConsentForm } from '~/components/dashboard/b2c/CheckoutConsentForm'
import { RESULTS_BENEFITS } from '~/components/dashboard/b2c/ResultsLockedCard'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName } from '~/components/ui/Button'
import Card from '~/components/ui/Card'
import { Eyebrow } from '~/components/ui/Eyebrow'

interface OfferPageProps {
  offer: OfferView
}

/** Page de l'offre (#102) : rappel du forfait, prix TTC, consentements, départ vers Stripe. */
export default function OfferPage({ offer }: OfferPageProps) {
  const priceLabel = formatPrice(offer.priceCents, offer.currency)

  return (
    <DashboardLayout>
      <Head title="Forfait" />
      <div className="mx-auto w-full max-w-3xl space-y-6 animate-fade-in">
        <AppLink href="/dashboard/candidat" className="text-sm font-medium text-accent hover:underline">
          ← Retour à mon espace
        </AppLink>
        <EmailVerificationBanner />

        {offer.hasPaidAccess ? (
          <Card variant="accent" className="space-y-4" role="status">
            <Eyebrow icon={<CheckCircle2 className="h-4 w-4" />}>Forfait réglé</Eyebrow>
            <h1 className="font-display text-display-sm text-ink">Vos résultats sont débloqués</h1>
            <p className="text-base text-ink-soft">
              Tous les exercices, leurs analyses IA et votre synthèse sont accessibles.
            </p>
            <div className="flex flex-wrap gap-3">
              <AppLink href="/dashboard/candidat" className={buttonClassName({ variant: 'primary' })}>
                Reprendre mon parcours
              </AppLink>
              <AppLink
                href="/dashboard/candidat/synthesis"
                className={buttonClassName({ variant: 'outline' })}
              >
                Voir ma synthèse
              </AppLink>
            </div>
          </Card>
        ) : (
          <>
            <Card className="space-y-6">
              <div className="space-y-3">
                <Eyebrow icon={<Sparkles className="h-4 w-4" />}>Forfait</Eyebrow>
                <h1 className="font-display text-display-sm text-ink">
                  Débloquez l’ensemble de votre parcours
                </h1>
                <p className="text-base text-ink-soft">
                  Un paiement unique, sans abonnement. Vos exercices gratuits restent acquis.
                </p>
              </div>
              <ul className="space-y-2">
                {RESULTS_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-sm text-ink-soft">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-ink-soft">
                <span className="font-display text-display-sm text-ink">{priceLabel}</span> TTC,
                paiement unique
              </p>
            </Card>

            <Card variant="flat" className="space-y-4">
              <h2 className="text-title-md text-ink">Avant de payer</h2>
              <CheckoutConsentForm
                paymentsEnabled={offer.paymentsEnabled}
                emailVerified={offer.emailVerified}
                priceLabel={priceLabel}
              />
              <p className="text-caption text-muted">
                Conditions générales de vente version {offer.termsVersion}.
              </p>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
