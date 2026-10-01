import React, { memo } from 'react'

/**
 * Variantes (DESIGN.md) :
 * - `default` : carte blanche, bordure hairline, ombre `card`.
 * - `flat`    : surface douce, sans ombre.
 * - `dark`    : la seule surface sombre (tier mis en avant, bande CTA).
 * - `warm`    : teinte accent chaud (ancien `amber`).
 * - `primary` : teinte primaire (ancien `sage`).
 */
export type CardVariant =
  | 'default'
  | 'flat'
  | 'dark'
  | 'warm'
  | 'primary'
  /** @deprecated utiliser `warm` */
  | 'amber'
  /** @deprecated utiliser `primary` */
  | 'sage'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: CardVariant
  /** Padding interne (défaut `lg` = 32px, hérité du dashboard ; les écrans marketing passent `md`). */
  padding?: CardPadding
  /** Ajoute une élévation au survol (cartes cliquables). */
  interactive?: boolean
}

const VARIANTS: Record<Exclude<CardVariant, 'amber' | 'sage'>, string> = {
  default: 'bg-surface border border-hairline shadow-card',
  flat: 'bg-surface-soft border border-hairline',
  dark: 'bg-ink text-on-ink',
  warm: 'bg-accent-warm-soft border border-accent-warm/20',
  primary: 'bg-primary-soft border border-primary/15',
}

const PADDINGS: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

function resolveVariant(variant: CardVariant): Exclude<CardVariant, 'amber' | 'sage'> {
  if (variant === 'amber') return 'warm'
  if (variant === 'sage') return 'primary'
  return variant
}

const Card = memo(function Card({
  children,
  className,
  variant = 'default',
  padding = 'lg',
  interactive = false,
  ...props
}: CardProps) {
  const classes = [
    'rounded-xl',
    PADDINGS[padding],
    VARIANTS[resolveVariant(variant)],
    interactive ? 'transition-shadow hover:shadow-raised' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
})

Card.displayName = 'Card'

export default Card
