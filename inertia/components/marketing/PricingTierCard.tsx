import { Check } from 'lucide-react'
import React from 'react'
import AppLink from '~/components/ui/AppLink'
import Badge from '~/components/ui/Badge'
import { buttonClassName } from '~/components/ui/Button'
import Card from '~/components/ui/Card'

export interface PricingTierCardProps {
  name: string
  tagline: string
  priceLabel: string
  priceSuffix: string
  footnote: string
  features: string[]
  ctaHref: string
  ctaLabel: string
  featured?: boolean
}

/** Carte d'offre tarifaire ; la version mise en avant est la seule carte sombre de la page. */
export const PricingTierCard: React.FC<PricingTierCardProps> = ({
  name,
  tagline,
  priceLabel,
  priceSuffix,
  footnote,
  features,
  ctaHref,
  ctaLabel,
  featured = false,
}) => {
  const muted = featured ? 'text-on-ink-soft' : 'text-muted'
  return (
    <Card variant={featured ? 'dark' : 'default'} padding="lg" className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className={`text-title-lg ${featured ? 'text-on-ink' : ''}`}>{name}</h3>
          <p className={`text-sm ${muted}`}>{tagline}</p>
        </div>
        {featured && <Badge variant="primary">Recommandé</Badge>}
      </div>
      <div className="mt-6">
        <p className={`text-display-sm ${featured ? 'text-on-ink' : 'text-ink'}`}>{priceLabel}</p>
        <p className={`mt-1 text-sm ${muted}`}>{priceSuffix}</p>
        <p className={`mt-3 text-sm ${muted}`}>{footnote}</p>
      </div>
      <ul className="mt-6 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <Check
              className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? 'text-primary-on-ink' : 'text-primary'}`}
              aria-hidden="true"
            />
            <span className={featured ? 'text-on-ink' : 'text-ink-soft'}>{feature}</span>
          </li>
        ))}
      </ul>
      <AppLink
        href={ctaHref}
        className={buttonClassName({
          variant: featured ? 'primary' : 'outline',
          size: 'md',
          className: 'mt-8 w-full',
        })}
      >
        {ctaLabel}
      </AppLink>
    </Card>
  )
}
