import {
  DISC_TRAIT_PALETTE,
  DISC_WHEEL_TRAIT_LABELS,
  DISC_WHEEL_TRAITS,
  type DiscWheelTrait,
} from '#shared/constants/disc_wheel'

export type DiscScoresPdf = Record<DiscWheelTrait, number>

// ─── DISC colors (charte, partagées avec la roue du dashboard) ─────────────────

export const DISC_COLORS = Object.fromEntries(
  DISC_WHEEL_TRAITS.map((trait) => [
    trait,
    {
      bar: DISC_TRAIT_PALETTE[trait].boldHex,
      bg: DISC_TRAIT_PALETTE[trait].softHex,
      ink: DISC_TRAIT_PALETTE[trait].inkHex,
      label: DISC_WHEEL_TRAIT_LABELS[trait],
    },
  ])
) as Record<DiscWheelTrait, { bar: string; bg: string; ink: string; label: string }>
