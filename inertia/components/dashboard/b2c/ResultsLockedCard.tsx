import { Lock, Sparkles } from 'lucide-react'
import { B2C_OFFER_PATH } from '#shared/constants/b2c'
import { formatPrice } from '#shared/helpers/billing/format_price'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName } from '~/components/ui/Button'
import Card from '~/components/ui/Card'
import { Eyebrow } from '~/components/ui/Eyebrow'
import { useBilling } from '~/hooks/use_billing'

export const RESULTS_BENEFITS = [
  'Tous les exercices du parcours et leurs résultats détaillés',
  'Les analyses IA de chaque exercice',
  'Votre synthèse de parcours et son export PDF',
  'La possibilité de demander un accompagnement par un expert',
] as const

interface ResultsLockedCardProps {
  /** Titre adapté au contexte (synthèse, exercice, profil…). */
  title?: string
  description?: string
  /** Variante réduite pour une colonne latérale. */
  compact?: boolean
  className?: string
}

/**
 * Carte « réservé au forfait » (#101), affichée partout où un résultat payant
 * est verrouillé pour un particulier. Le verrou réel est côté serveur : cette
 * carte oriente vers l'offre (#102) ou annonce « Bientôt disponible ».
 */
export function ResultsLockedCard({
  title = 'Vos résultats sont réservés au forfait',
  description = 'Réglez le forfait une seule fois pour débloquer l’ensemble de votre parcours.',
  compact = false,
  className = '',
}: ResultsLockedCardProps) {
  const billing = useBilling()
  const price = billing ? formatPrice(billing.resultsPriceCents, billing.currency) : null
  const paymentsEnabled = Boolean(billing?.paymentsEnabled)

  return (
    <Card
      variant="sun"
      padding={compact ? 'md' : 'lg'}
      className={`space-y-4 ${className}`.trim()}
      role="region"
      aria-label={title}
    >
      <Eyebrow tone="muted" icon={<Lock className="h-4 w-4" />}>
        Forfait
      </Eyebrow>
      <div className="space-y-2">
        <h2 className={`${compact ? 'text-title-md' : 'text-title-lg'} text-ink`}>{title}</h2>
        <p className="text-sm text-ink-soft">{description}</p>
      </div>
      {!compact && (
        <ul className="space-y-2">
          {RESULTS_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 text-sm text-ink-soft">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {price && (
          <p className="text-sm text-ink-soft">
            <span className="font-display text-title-lg text-ink">{price}</span> TTC, paiement unique
          </p>
        )}
        {paymentsEnabled ? (
          <AppLink href={B2C_OFFER_PATH} className={buttonClassName({ variant: 'primary', size: 'md' })}>
            Débloquer mes résultats
          </AppLink>
        ) : (
          <span className="text-caption text-muted">Paiement bientôt disponible</span>
        )}
      </div>
    </Card>
  )
}
