import React, { memo } from 'react'

/**
 * Variantes (DESIGN.md) :
 * - `default` : carte blanche, bordure hairline, ombre `card`.
 * - `flat`    : surface douce, sans ombre.
 * - `dark`    : la seule surface sombre (tier mis en avant, bande CTA).
 * - `sun`     : teinte soleil, mise en avant chaude (anciens `warm` et `amber`).
 * - `accent`  : teinte teal de l'accent (ancien `sage`).
 * - `primary` : teinte encre discrète.
 */
export type CardVariant =
  | 'default'
  | 'flat'
  | 'dark'
  | 'sun'
  | 'accent'
  | 'primary'
  /** @deprecated utiliser `sun` */
  | 'warm'
  /** @deprecated utiliser `sun` */
  | 'amber'
  /** @deprecated utiliser `accent` */
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

type ResolvedCardVariant = Exclude<CardVariant, 'warm' | 'amber' | 'sage'>

const VARIANTS: Record<ResolvedCardVariant, string> = {
  default: 'bg-surface border border-hairline shadow-card',
  flat: 'bg-surface-soft border border-hairline',
  dark: 'bg-ink text-on-ink',
  sun: 'bg-sun-soft border border-tint-sun-ink/15',
  accent: 'bg-accent-soft border border-accent/15',
  primary: 'bg-primary-soft border border-primary/15',
}

const PADDINGS: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

function resolveVariant(variant: CardVariant): ResolvedCardVariant {
  if (variant === 'warm' || variant === 'amber') return 'sun'
  if (variant === 'sage') return 'accent'
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
