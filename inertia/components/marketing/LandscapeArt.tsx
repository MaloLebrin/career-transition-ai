import React, { useId } from 'react'

export type LandscapeArtVariant = 'hero' | 'dusk' | 'horizon'

export interface LandscapeArtProps {
  /** `hero` : panorama complet ; `dusk` : silhouettes sur surface ink ; `horizon` : bande pastel basse. */
  variant?: LandscapeArtVariant
  className?: string
}

const VIEW_BOX: Record<LandscapeArtVariant, string> = {
  hero: '0 0 1200 400',
  dusk: '0 0 1200 160',
  horizon: '0 0 1200 200',
}

/**
 * Le seul bloc illustratif du design system (DESIGN.md §1) : un paysage calme — ciel abricot,
 * soleil, montagnes lavande, lac teal, prairie — dessiné en formes plates avec les teintes
 * expressives (`tint-*`, `tint-*-bold`). Aucune couleur en dur : tout passe par les variables
 * du thème. Purement décoratif, masqué aux lecteurs d'écran. La variante `hero` s'anime
 * doucement (nuages, oiseaux, halo du soleil, reflets du lac : classes `landscape-*` de
 * `app.css`, coupées par `prefers-reduced-motion`).
 */
export const LandscapeArt: React.FC<LandscapeArtProps> = ({ variant = 'hero', className = '' }) => {
  const skyId = `${useId()}-sky`

  return (
    <svg
      viewBox={VIEW_BOX[variant]}
      preserveAspectRatio="xMidYMax slice"
      className={`block h-full w-full ${className}`.trim()}
      aria-hidden="true"
      focusable="false"
      data-variant={variant}
    >
      {variant === 'hero' && <HeroScene skyId={skyId} />}
      {variant === 'dusk' && <DuskScene />}
      {variant === 'horizon' && <HorizonScene skyId={skyId} />}
    </svg>
  )
}

/** Oiseaux : deux traits souples, en encre douce. */
const Birds: React.FC<{ transform?: string; animated?: boolean }> = ({ transform, animated }) => (
  <g transform={transform}>
    <g
      className={animated ? 'landscape-birds' : undefined}
      fill="none"
      stroke="var(--color-ink-soft)"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.55"
    >
      <path d="M0 10 q8 -10 16 0 q8 -10 16 0" />
      <path d="M44 -4 q6 -8 12 0 q6 -8 12 0" />
    </g>
  </g>
)

const HeroScene: React.FC<{ skyId: string }> = ({ skyId }) => (
  <>
    <defs>
      <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--color-tint-sky)" />
        <stop offset="0.55" stopColor="var(--color-tint-apricot)" />
        <stop offset="1" stopColor="var(--color-sun-soft)" />
      </linearGradient>
    </defs>
    {/* Ciel */}
    <rect width="1200" height="400" fill={`url(#${skyId})`} />
    {/* Soleil et son halo */}
    <circle
      cx="880"
      cy="168"
      r="96"
      fill="var(--color-sun-soft)"
      opacity="0.6"
      className="landscape-sun-halo"
    />
    <circle cx="880" cy="168" r="46" fill="var(--color-tint-sun-bold)" />
    {/* Nuages */}
    <g fill="var(--color-surface)" opacity="0.7">
      <g className="landscape-cloud landscape-cloud-slow">
        <ellipse cx="260" cy="110" rx="90" ry="18" />
        <ellipse cx="300" cy="98" rx="50" ry="20" />
      </g>
      <ellipse cx="1010" cy="80" rx="70" ry="14" className="landscape-cloud landscape-cloud-fast" />
    </g>
    <Birds transform="translate(560 120)" animated />
    {/* Montagnes lointaines → proches */}
    <path
      d="M0 250 L120 190 L220 232 L330 160 L440 226 L540 186 L640 238 L760 176 L860 230 L960 196 L1080 244 L1200 204 L1200 320 L0 320 Z"
      fill="var(--color-tint-lavender-bold)"
      opacity="0.45"
    />
    <path
      d="M0 290 L90 236 L200 270 L310 214 L410 262 L520 222 L640 276 L740 236 L860 282 L980 230 L1100 274 L1200 248 L1200 330 L0 330 Z"
      fill="var(--color-tint-lavender-bold)"
      opacity="0.75"
    />
    <path
      d="M0 318 L140 282 L260 304 L380 270 L500 300 L620 278 L760 306 L900 274 L1040 300 L1200 282 L1200 340 L0 340 Z"
      fill="var(--color-tint-lavender-ink)"
      opacity="0.8"
    />
    {/* Lac */}
    <rect x="0" y="300" width="1200" height="60" fill="var(--color-tint-lake)" />
    <g stroke="var(--color-tint-lake-bold)" strokeWidth="3" strokeLinecap="round" opacity="0.45">
      <path className="landscape-ripple" d="M140 322 h80" />
      <path className="landscape-ripple landscape-ripple-b" d="M460 334 h120" />
      <path className="landscape-ripple landscape-ripple-c" d="M700 316 h60" />
      <path className="landscape-ripple landscape-ripple-d" d="M980 330 h100" />
    </g>
    <ellipse
      className="landscape-sun-halo"
      cx="880"
      cy="322"
      rx="70"
      ry="9"
      fill="var(--color-sun-soft)"
      opacity="0.8"
    />
    {/* Prairie */}
    <path
      d="M0 352 C 200 318, 420 322, 620 348 S 1000 372, 1200 344 L1200 400 L0 400 Z"
      fill="var(--color-tint-meadow-bold)"
    />
    <path
      d="M0 378 C 160 350, 300 356, 460 374 S 760 392, 1200 376 L1200 400 L0 400 Z"
      fill="var(--color-tint-meadow)"
      opacity="0.55"
    />
    {/* Fleurs */}
    <g>
      <circle cx="90" cy="368" r="5" fill="var(--color-tint-blossom-bold)" />
      <circle cx="150" cy="386" r="4" fill="var(--color-sun)" />
      <circle cx="230" cy="374" r="4" fill="var(--color-tint-blossom-bold)" />
      <circle cx="340" cy="388" r="5" fill="var(--color-surface)" />
      <circle cx="1040" cy="380" r="4" fill="var(--color-tint-blossom-bold)" />
      <circle cx="1120" cy="366" r="5" fill="var(--color-sun)" />
    </g>
  </>
)

/** Variante crépuscule : silhouettes et lac posés sur une surface ink, fond transparent. */
const DuskScene: React.FC = () => (
  <>
    {/* Lune pâle : du jaune en opacité sur ink tournerait à l'olive */}
    <circle cx="920" cy="72" r="22" fill="var(--color-sun-soft)" opacity="0.55" />
    <path
      d="M0 96 L120 58 L230 84 L350 40 L470 82 L580 52 L700 90 L820 48 L940 86 L1060 56 L1200 84 L1200 160 L0 160 Z"
      fill="var(--color-tint-lavender-bold)"
      opacity="0.22"
    />
    <path
      d="M0 124 L150 94 L280 114 L420 84 L560 118 L700 92 L860 124 L1000 96 L1200 120 L1200 160 L0 160 Z"
      fill="var(--color-tint-lavender-ink)"
      opacity="0.5"
    />
    <rect x="0" y="130" width="1200" height="30" fill="var(--color-accent-on-ink)" opacity="0.18" />
    <g stroke="var(--color-accent-on-ink)" strokeWidth="2" strokeLinecap="round" opacity="0.35">
      <path d="M200 142 h70" />
      <path d="M640 150 h90" />
      <path d="M960 140 h60" />
    </g>
  </>
)

/** Variante horizon : bande pastel sans soleil, derrière une carte. */
const HorizonScene: React.FC<{ skyId: string }> = ({ skyId }) => (
  <>
    <defs>
      <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--color-canvas)" />
        <stop offset="1" stopColor="var(--color-tint-apricot)" />
      </linearGradient>
    </defs>
    <rect width="1200" height="200" fill={`url(#${skyId})`} />
    <path
      d="M0 120 L130 78 L250 108 L380 62 L500 104 L620 72 L760 112 L900 70 L1040 106 L1200 80 L1200 200 L0 200 Z"
      fill="var(--color-tint-lavender-bold)"
      opacity="0.4"
    />
    <path
      d="M0 150 L160 116 L300 138 L450 108 L600 140 L760 114 L920 146 L1060 120 L1200 142 L1200 200 L0 200 Z"
      fill="var(--color-tint-lavender)"
    />
    <rect x="0" y="156" width="1200" height="24" fill="var(--color-tint-lake)" />
    <path
      d="M0 184 C 220 164, 480 168, 700 180 S 1040 192, 1200 176 L1200 200 L0 200 Z"
      fill="var(--color-tint-meadow)"
    />
  </>
)
