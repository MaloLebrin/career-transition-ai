import { useForm } from '@inertiajs/react'
import { MailCheck } from 'lucide-react'
import React from 'react'
import { ACCOUNT_TYPES } from '#shared/constants/b2c'
import { useAuth } from '~/hooks/use_auth'
import Button from '../ui/Button'

export const RESEND_EMAIL_VERIFICATION_URL = '/dashboard/candidat/email-verification/resend'

/**
 * Bandeau de vérification d'e-mail (#98), réservé aux particuliers (`b2c`)
 * dont l'adresse n'est pas encore confirmée. Le parcours gratuit reste
 * ouvert : la confirmation n'est exigée qu'au moment de régler le forfait.
 * Tons `warning` du design system (pêche, jamais le soleil du bouton secondaire).
 */
export function EmailVerificationBanner() {
  const { user } = useAuth()
  const { post, processing } = useForm({})

  if (!user || user.accountType !== ACCOUNT_TYPES.B2C || user.emailVerified) return null

  return (
    <section
      role="status"
      aria-labelledby="email-verification-title"
      className="flex flex-col gap-4 rounded-xl border border-warning/20 bg-warning-soft p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-warning"
          aria-hidden
        >
          <MailCheck size={18} />
        </span>
        <div>
          <p id="email-verification-title" className="text-title-sm text-ink">
            Confirmez votre adresse e-mail
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Un lien de confirmation vous a été envoyé à{' '}
            <span className="font-medium text-ink">{user.email}</span>. Vous pouvez continuer vos
            exercices gratuits : la confirmation ne sera demandée que pour régler le forfait.
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        isLoading={processing}
        onClick={() => post(RESEND_EMAIL_VERIFICATION_URL, { preserveScroll: true })}
      >
        Renvoyer le lien
      </Button>
    </section>
  )
}
