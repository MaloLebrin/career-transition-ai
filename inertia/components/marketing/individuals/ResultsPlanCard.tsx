import React from 'react'
import { B2C_PUBLIC_PATHS } from '#shared/constants/b2c'
import AppLink from '~/components/ui/AppLink'
import Badge from '~/components/ui/Badge'
import Card from '~/components/ui/Card'
import { useResultsPriceLabel } from '~/hooks/use_results_price_label'
import { EXCLUDED, INCLUDED } from './copy'

/** Carte du forfait particuliers : prix TTC, ce qui est inclus et ce qui ne l'est pas. */
export const ResultsPlanCard: React.FC = () => {
  const priceLabel = useResultsPriceLabel()

  return (
    <Card
      variant="dark"
      padding="lg"
      className="flex flex-col gap-6"
      role="group"
      aria-label="Forfait particuliers"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-title-lg text-on-ink">Le forfait</h3>
          <p className="text-sm text-on-ink-soft">Paiement unique, sans abonnement</p>
        </div>
        <Badge variant="sun">TTC</Badge>
      </div>
      <p className="font-display text-display-sm text-on-ink">{priceLabel}</p>
      <div className="space-y-2">
        <p className="text-eyebrow text-accent-on-ink">Inclus</p>
        <ul className="space-y-2 text-sm text-on-ink">
          {INCLUDED.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
      </div>
      <div className="space-y-2">
        <p className="text-eyebrow text-on-ink-muted">Non inclus</p>
        <ul className="space-y-2 text-sm text-on-ink-soft">
          {EXCLUDED.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
      </div>
      <div className="mt-auto flex flex-wrap gap-x-6 gap-y-2 border-t border-on-ink/15 pt-6">
        <AppLink
          href={B2C_PUBLIC_PATHS.terms}
          className="text-sm font-medium text-accent-on-ink hover:underline"
        >
          Conditions de vente
        </AppLink>
        <AppLink
          href={B2C_PUBLIC_PATHS.privacy}
          className="text-sm font-medium text-accent-on-ink hover:underline"
        >
          Politique de confidentialité
        </AppLink>
      </div>
    </Card>
  )
}
