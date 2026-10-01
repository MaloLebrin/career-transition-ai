import React, { memo } from 'react'

/**
 * Tons sémantiques + teintes pastel (DESIGN.md). Casse de phrase, jamais d'uppercase.
 * Les anciens noms de couleur Tailwind sont conservés comme alias dépréciés pour le
 * dashboard (phase 3 de la refonte).
 */
export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'sage'
  | 'teal'
  | 'sand'
  | 'terracotta'
  | 'lavender'
  | 'sky'

/** @deprecated anciens noms, mappés sur un ton sémantique */
export type LegacyBadgeVariant =
  | 'violet'
  | 'lime'
  | 'orange'
  | 'pink'
  | 'cyan'
  | 'slate'
  | 'indigo'
  | 'emerald'
  | 'amber'

export type BadgeVariant = BadgeTone | LegacyBadgeVariant

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: BadgeVariant
  /** Affiche un point de statut avant le libellé. */
  dot?: boolean
}

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-soft text-muted border-hairline',
  primary: 'bg-primary-soft text-primary-pressed border-primary/15',
  success: 'bg-success-soft text-success border-success/15',
  warning: 'bg-warning-soft text-warning border-warning/15',
  danger: 'bg-danger-soft text-danger border-danger/15',
  info: 'bg-info-soft text-info border-info/15',
  sage: 'bg-tint-sage text-tint-sage-ink border-transparent',
  teal: 'bg-tint-teal text-tint-teal-ink border-transparent',
  sand: 'bg-tint-sand text-tint-sand-ink border-transparent',
  terracotta: 'bg-tint-terracotta text-tint-terracotta-ink border-transparent',
  lavender: 'bg-tint-lavender text-tint-lavender-ink border-transparent',
  sky: 'bg-tint-sky text-tint-sky-ink border-transparent',
}

const LEGACY: Record<LegacyBadgeVariant, BadgeTone> = {
  violet: 'lavender',
  indigo: 'lavender',
  lime: 'success',
  emerald: 'success',
  orange: 'warning',
  amber: 'warning',
  pink: 'terracotta',
  cyan: 'info',
  slate: 'neutral',
}

export function resolveBadgeTone(variant: BadgeVariant): BadgeTone {
  return variant in TONES
    ? (variant as BadgeTone)
    : (LEGACY[variant as LegacyBadgeVariant] ?? 'neutral')
}

const Badge = memo(function Badge({
  children,
  variant = 'neutral',
  dot = false,
  className = '',
  ...props
}: BadgeProps) {
  const tone = TONES[resolveBadgeTone(variant)]
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border text-caption whitespace-nowrap ${tone} ${className}`.trim()}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
})

Badge.displayName = 'Badge'

export default Badge
