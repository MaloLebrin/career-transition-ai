import React from 'react'

export interface HeroBackdropProps {
  /** `strong` : maillage franc (héros d'accueil) ; `soft` : atténué (héros secondaires). */
  intensity?: 'strong' | 'soft'
}

/**
 * Fond des héros marketing (DESIGN.md §5 bis) : maillage animé des teintes `-bold` en bande
 * à bord diagonal, une grille hairline, et un voile `canvas` côté texte pour que l'encre reste
 * lisible (jamais de texte directement sur le maillage).
 */
export const HeroBackdrop: React.FC<HeroBackdropProps> = ({ intensity = 'strong' }) => (
  <div
    className="pointer-events-none absolute inset-0 -z-10"
    aria-hidden="true"
    data-testid="hero-backdrop"
  >
    <div
      className={`absolute inset-x-0 top-0 bg-hero-mesh animate-mesh-drift clip-skew-b ${
        intensity === 'strong' ? 'h-[88%] opacity-90' : 'h-[75%] opacity-45'
      }`}
    />
    <div className="absolute inset-0 bg-grid-hairline opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
    <div className="absolute inset-0 bg-linear-to-b from-canvas/60 via-canvas/80 to-canvas lg:bg-linear-to-r lg:from-canvas lg:via-canvas/85 lg:to-canvas/0" />
  </div>
)
