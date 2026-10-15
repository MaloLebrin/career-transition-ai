import React from 'react'
import { MARKETING_TINTS, type MarketingTint } from '../tints'

export interface TeamMonogramProps {
  firstName: string
  lastName: string
  /** Teinte du disque (lac par défaut). */
  tint?: MarketingTint
  size?: 'sm' | 'lg'
}

const SIZES: Record<NonNullable<TeamMonogramProps['size']>, string> = {
  sm: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-title-md',
}

/** Initiales d'un membre de l'équipe sur un disque teinté (DESIGN.md : pas de photo). Décoratif. */
export const TeamMonogram: React.FC<TeamMonogramProps> = ({
  firstName,
  lastName,
  tint = 'lake',
  size = 'lg',
}) => (
  <span
    aria-hidden="true"
    className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold ${SIZES[size]} ${MARKETING_TINTS[tint].surface} ${MARKETING_TINTS[tint].ink}`}
  >
    {firstName.charAt(0)}
    {lastName.charAt(0)}
  </span>
)
