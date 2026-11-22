import { memo } from 'react'
import { BADGE_U_PATH, BADGE_U_STROKE } from './logo_geometry'

export interface LogoBadgeProps {
  /** Diamètre en px (≤ 32 : en dessous, la marque complète n'est plus lisible). */
  size: number
  className?: string
}

/** Marque des petites tailles : cercle jaune plein, U encre seul (comme le favicon). */
export const LogoBadge = memo(function LogoBadge({ size, className = '' }: LogoBadgeProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={`shrink-0 ${className}`.trim()}
      aria-hidden="true"
      focusable="false"
      data-logo-mark="badge"
    >
      <circle cx={16} cy={16} r={16} fill="var(--color-sun)" />
      <path
        d={BADGE_U_PATH}
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth={BADGE_U_STROKE}
        strokeLinecap="round"
      />
    </svg>
  )
})

LogoBadge.displayName = 'LogoBadge'
