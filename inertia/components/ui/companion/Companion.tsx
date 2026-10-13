import React, { useId } from 'react'
import { Bubble, Eyes, Padlock, Panel, Sparkles, Sprout } from './parts'
import type {
  CompanionPalette,
  CompanionPose,
  CompanionSize,
  CompanionTone,
  EyeKind,
} from './types'

export type { CompanionPose, CompanionSize, CompanionTone } from './types'

export interface CompanionProps {
  /** `wave` accueil, `cheer` succès, `think` attente ou lien invalide, `guard` forfait, `rest` état vide. */
  pose?: CompanionPose
  /** 48 / 96 / 160 / 240 px ; `className` peut surcharger. */
  size?: CompanionSize
  /** `inverse` : posé sur une surface `bg-ink` (traits en `on-ink`). */
  tone?: CompanionTone
  /** Flottement, clignement, balancement de la tête, étincelles — coupés par `prefers-reduced-motion`. */
  animated?: boolean
  className?: string
}

export const COMPANION_POSES: readonly CompanionPose[] = ['wave', 'cheer', 'think', 'guard', 'rest']
export const COMPANION_TONES: readonly CompanionTone[] = ['default', 'inverse']

const SIZE_CLASS: Record<CompanionSize, string> = {
  sm: 'h-12 w-12',
  md: 'h-24 w-24',
  lg: 'h-40 w-40',
  xl: 'h-60 w-60',
}

/** Coque blanche, panneaux abricot du ciel, mécanique mauve des montagnes, lentille lac. Aucune couleur en dur. */
const PALETTE: Record<CompanionTone, CompanionPalette> = {
  default: {
    line: 'var(--color-ink)',
    stroke: 'var(--color-ink)',
    shell: 'var(--color-surface)',
    highlight: 'var(--color-surface)',
    panel: 'var(--color-tint-apricot-bold)',
    metal: 'var(--color-tint-lavender-bold)',
    lens: 'var(--color-tint-lake-bold)',
    leaf: 'var(--color-tint-meadow-bold)',
    lock: 'var(--color-tint-lake-bold)',
  },
  inverse: {
    line: 'var(--color-ink)',
    stroke: 'var(--color-on-ink)',
    shell: 'var(--color-on-ink)',
    highlight: 'var(--color-on-ink)',
    panel: 'var(--color-tint-apricot-bold)',
    metal: 'var(--color-tint-lavender-bold)',
    lens: 'var(--color-tint-lake-bold)',
    leaf: 'var(--color-tint-meadow-bold)',
    lock: 'var(--color-tint-lake-bold)',
  },
}

type Prop = 'padlock' | 'sprout' | 'bubble' | 'sparkles'

interface PoseSpec {
  eyes: EyeKind
  /** Inclinaison du dôme (degrés, autour de la base du cou). */
  tilt: number
  /** Décalage horizontal du dôme sur la sphère. */
  shift: number
  /** Le dôme se balance (classe `companion-wave` si animé). */
  waving?: boolean
  prop?: Prop
}

const POSES: Record<CompanionPose, PoseSpec> = {
  wave: { eyes: 'open', tilt: 12, shift: 6, waving: true },
  cheer: { eyes: 'happy', tilt: -8, shift: 0, prop: 'sparkles' },
  think: { eyes: 'up', tilt: -12, shift: -4, prop: 'bubble' },
  guard: { eyes: 'open', tilt: 10, shift: 10, prop: 'padlock' },
  rest: { eyes: 'squint', tilt: 6, shift: -4, prop: 'sprout' },
}

/**
 * Le compagnon du candidat (DESIGN.md §1) : un droïde sphérique — une boule à panneaux
 * circulaires qui roule, surmontée d'un dôme à lentille noire, petite lentille et deux antennes,
 * bande sombre à la base du dôme. Sans bras : toute l'expression tient à l'inclinaison du dôme.
 * Coque claire, panneaux abricot, mécanique mauve, dessiné en formes plates avec les variables
 * du thème, comme `LandscapeArt`. Purement décoratif (`aria-hidden`) : il accompagne toujours
 * un titre ou une icône qui porte le sens, jamais seul, jamais plus d'un par écran.
 */
export const Companion: React.FC<CompanionProps> = ({
  pose = 'rest',
  size = 'md',
  tone = 'default',
  animated = false,
  className = '',
}) => {
  const sphereClipId = `${useId()}-sphere`
  const p = PALETTE[tone]
  const spec = POSES[pose]
  const cls = (name: string) => (animated ? name : undefined)

  return (
    <svg
      viewBox="0 0 200 200"
      className={`block shrink-0 ${SIZE_CLASS[size]} ${className}`.trim()}
      aria-hidden="true"
      focusable="false"
      data-pose={pose}
      data-tone={tone}
      data-size={size}
    >
      <defs>
        <clipPath id={sphereClipId}>
          <circle cx="100" cy="128" r="58" />
        </clipPath>
      </defs>
      <g className={cls('companion-float')}>
        {spec.prop === 'sparkles' && <Sparkles p={p} animated={animated} />}
        {spec.prop === 'bubble' && <Bubble p={p} />}
        {/* Ombre au sol */}
        <ellipse cx="100" cy="188" rx="48" ry="6" fill={p.metal} opacity="0.35" />
        {/* Sphère : coque, panneaux circulaires, ombre, trait */}
        <circle cx="100" cy="128" r="58" fill={p.shell} />
        <g clipPath={`url(#${sphereClipId})`}>
          <Panel cx={100} cy={128} r={30} p={p} />
          <Panel cx={44} cy={108} r={26} p={p} />
          <Panel cx={156} cy={108} r={26} p={p} />
          <Panel cx={64} cy={178} r={24} p={p} />
          <Panel cx={136} cy={178} r={24} p={p} />
          <g stroke={p.metal} strokeWidth="3" fill="none" opacity="0.8">
            <path d="M58 92 q42 -16 84 0" />
            <path d="M48 160 q52 20 104 0" />
          </g>
          <circle cx="112" cy="140" r="58" fill={p.metal} opacity="0.14" />
        </g>
        <circle cx="100" cy="128" r="58" fill="none" stroke={p.stroke} strokeWidth="3.5" />
        <ellipse
          cx="74"
          cy="92"
          rx="12"
          ry="5"
          fill={p.highlight}
          opacity="0.6"
          transform="rotate(-30 74 92)"
        />
        {/* Dôme : coque, bande orange puis bande sombre, lentilles, antennes */}
        <g transform={`translate(${spec.shift} 0) rotate(${spec.tilt} 100 88)`}>
          <g className={spec.waving ? cls('companion-wave') : undefined}>
            <g stroke={p.stroke} strokeWidth="3" strokeLinecap="round">
              <path d="M104 40 V12" />
              <path d="M96 40 V24" />
            </g>
            <circle cx="104" cy="11" r="3" fill={p.metal} />
            <path d="M66 72 a34 34 0 0 1 68 0 z" fill={p.shell} />
            <path d="M66 72 a34 34 0 0 1 68 0" fill="none" stroke={p.stroke} strokeWidth="3.5" />
            <path
              d="M72 56 q28 -14 56 0"
              fill="none"
              stroke={p.panel}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <rect x="64" y="64" width="72" height="5" fill={p.panel} />
            <rect x="62" y="69" width="76" height="8" rx="3" fill={p.line} />
            <circle cx="74" cy="60" r="2.5" fill={p.metal} />
            <circle cx="126" cy="60" r="2.5" fill={p.metal} />
            <Eyes kind={spec.eyes} p={p} animated={animated} />
          </g>
        </g>
        {spec.prop === 'padlock' && <Padlock p={p} />}
        {spec.prop === 'sprout' && <Sprout p={p} />}
      </g>
    </svg>
  )
}
