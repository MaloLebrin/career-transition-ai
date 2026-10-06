import { useForm } from '@inertiajs/react'
import { Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BILLING_PATHS } from '#shared/constants/billing'
import { WITHDRAWAL_NOTICE } from '#shared/constants/legal'
import AppLink from '~/components/ui/AppLink'
import Button from '~/components/ui/Button'

interface CheckoutConsentFormProps {
  /** `STRIPE_ENABLED` : sinon le bouton est inactif et annonce « Bientôt disponible ». */
  paymentsEnabled: boolean
  /** Adresse confirmée (#98) : prérequis au paiement. */
  emailVerified: boolean
  /** Prix TTC déjà formaté (« 49 € »). */
  priceLabel: string
}

const CHECKBOX_CLASS =
  'mt-0.5 h-4 w-4 shrink-0 rounded border-hairline-strong accent-primary focus:ring-accent'

/**
 * Consentements avant Stripe Checkout (#102) : CGV et renonciation expresse au
 * droit de rétractation. Le `POST` répond par une redirection externe
 * (`inertia.location`) vers la page de paiement hébergée, où se saisit un
 * éventuel code promo (#139) — jamais ici.
 */
export function CheckoutConsentForm({
  paymentsEnabled,
  emailVerified,
  priceLabel,
}: CheckoutConsentFormProps) {
  const { data, setData, post, errors, cancel } = useForm({
    acceptTerms: false,
    waiveWithdrawal: false,
  })
  const [leaving, setLeaving] = useState(false)

  // bfcache : au retour depuis Stripe (bouton Précédent), la page est restaurée
  // telle quelle, bouton en chargement compris ; on réinitialise la soumission.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        cancel()
        setLeaving(false)
      }
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [cancel])

  const canPay = paymentsEnabled && emailVerified

  return (
    <form
      className="space-y-5"
      aria-label="Consentements et paiement"
      onSubmit={(event) => {
        event.preventDefault()
        setLeaving(true)
        post(BILLING_PATHS.checkout, { onFinish: () => setLeaving(false) })
      }}
    >
      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input
          type="checkbox"
          name="acceptTerms"
          checked={data.acceptTerms}
          onChange={(e) => setData('acceptTerms', e.target.checked)}
          aria-invalid={Boolean(errors.acceptTerms)}
          aria-describedby={errors.acceptTerms ? 'accept-terms-error' : undefined}
          className={CHECKBOX_CLASS}
        />
        <span>
          J’ai lu et j’accepte les{' '}
          <AppLink href="/cgv" external className="font-medium text-accent hover:underline">
            conditions générales de vente
          </AppLink>
          .
        </span>
      </label>
      {errors.acceptTerms && (
        <p id="accept-terms-error" role="alert" className="text-sm text-danger">
          {errors.acceptTerms}
        </p>
      )}

      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input
          type="checkbox"
          name="waiveWithdrawal"
          checked={data.waiveWithdrawal}
          onChange={(e) => setData('waiveWithdrawal', e.target.checked)}
          aria-invalid={Boolean(errors.waiveWithdrawal)}
          aria-describedby={errors.waiveWithdrawal ? 'waive-withdrawal-error' : undefined}
          className={CHECKBOX_CLASS}
        />
        <span>{WITHDRAWAL_NOTICE}</span>
      </label>
      {errors.waiveWithdrawal && (
        <p id="waive-withdrawal-error" role="alert" className="text-sm text-danger">
          {errors.waiveWithdrawal}
        </p>
      )}

      {!emailVerified && (
        <p role="status" className="text-sm text-warning">
          Confirmez d’abord votre adresse e-mail : le lien vous a été envoyé à l’inscription.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!canPay}
          isLoading={leaving}
          icon={<Lock className="h-4 w-4" />}
        >
          {paymentsEnabled ? `Payer ${priceLabel}` : 'Bientôt disponible'}
        </Button>
        <p className="text-caption text-muted">
          Paiement sécurisé par Stripe. Vous recevrez une facture par e-mail.
        </p>
      </div>
      {paymentsEnabled && (
        <p className="text-caption text-muted">
          Un code promo ? Saisissez-le à l’étape de paiement sécurisé.
        </p>
      )}
    </form>
  )
}
