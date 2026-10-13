import React from 'react'
import { LandscapeArt } from './LandscapeArt'

export type HeroBackdropScene = 'mesh' | 'landscape'

export interface HeroBackdropProps {
  /** `strong` : maillage franc (héros d'accueil) ; `soft` : atténué (héros secondaires). */
  intensity?: 'strong' | 'soft'
  /**
   * `mesh` : maillage animé des teintes `-bold` ; `landscape` : le panorama `LandscapeArt`
   * en pleine largeur, calé en bas de la section (héros de l'accueil particuliers).
   */
  scene?: HeroBackdropScene
}

/**
 * Fond des héros marketing (DESIGN.md §5 bis) : une scène (maillage animé en bande à bord
 * diagonal + grille hairline, ou le paysage du design system) et un voile `canvas` côté texte
 * pour que l'encre reste lisible (jamais de texte directement sur la scène).
 */
export const HeroBackdrop: React.FC<HeroBackdropProps> = ({
  intensity = 'strong',
  scene = 'mesh',
}) => (
  <div
    className="pointer-events-none absolute inset-0 -z-10"
    aria-hidden="true"
    data-testid="hero-backdrop"
    data-scene={scene}
  >
    {scene === 'landscape' ? (
      <>
        <div className="absolute inset-0 overflow-hidden">
          <LandscapeArt variant="hero" />
        </div>
        <div className="absolute inset-0 bg-linear-to-b from-canvas/90 via-canvas/70 to-canvas/15 lg:bg-linear-to-r lg:from-canvas lg:via-canvas/85 lg:to-canvas/0" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-hairline" />
      </>
    ) : (
      <>
        <div
          className={`absolute inset-x-0 top-0 bg-hero-mesh animate-mesh-drift clip-skew-b ${
            intensity === 'strong' ? 'h-[88%] opacity-90' : 'h-[75%] opacity-45'
          }`}
        />
        <div className="absolute inset-0 bg-grid-hairline opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
        <div className="absolute inset-0 bg-linear-to-b from-canvas/60 via-canvas/80 to-canvas lg:bg-linear-to-r lg:from-canvas lg:via-canvas/85 lg:to-canvas/0" />
      </>
    )}
  </div>
)
