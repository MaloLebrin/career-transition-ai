import { memo } from 'react'
import {
  BOARD_FOOT,
  BOARD_PATH,
  GALET_PATH,
  GALET_SCALE,
  GALET_TRANSFORM,
  MARK_VIEWBOX,
  MONOGRAM,
} from './logo_geometry'

export type LogoMarkTone = 'default' | 'inverse'

export interface LogoMarkProps {
  /** Hauteur en px ; la largeur suit le cadre 340 × 292. */
  height: number
  /** `inverse` : plongeoir clair, pour les surfaces ink. */
  tone?: LogoMarkTone
  className?: string
}

/**
 * La marque jumpUjob : le galet jaune « jUj » qui s'élance du plongeoir. SVG inline
 * (couleurs en variables CSS), décoratif : le nom accessible est porté par `Logo`.
 */
export const LogoMark = memo(function LogoMark({
  height,
  tone = 'default',
  className = '',
}: LogoMarkProps) {
  const width = Math.round((height * MARK_VIEWBOX.width) / MARK_VIEWBOX.height)
  const board = tone === 'inverse' ? 'var(--color-on-ink-soft)' : 'var(--color-ink)'
  return (
    <svg
      viewBox={`0 ${MARK_VIEWBOX.minY} ${MARK_VIEWBOX.width} ${MARK_VIEWBOX.height}`}
      width={width}
      height={height}
      className={`shrink-0 ${className}`.trim()}
      aria-hidden="true"
      focusable="false"
      data-logo-mark="full"
    >
      <path d={BOARD_PATH} fill="none" stroke={board} strokeWidth={16} strokeLinecap="round" />
      <rect {...BOARD_FOOT} fill={board} />
      <g transform={GALET_TRANSFORM}>
        <path d={GALET_PATH} transform={`scale(${GALET_SCALE})`} fill="var(--color-sun)" />
        <g fill="none" strokeWidth={MONOGRAM.strokeWidth} strokeLinecap="round">
          <path d={MONOGRAM.leftJ} stroke="var(--color-ink)" />
          <path d={MONOGRAM.u} stroke="var(--color-surface)" />
          <path d={MONOGRAM.rightJ} stroke="var(--color-ink)" />
        </g>
        {MONOGRAM.eyes.map((eye) => (
          <circle key={eye.cx} {...eye} r={MONOGRAM.eyeRadius} fill="var(--color-ink)" />
        ))}
      </g>
    </svg>
  )
})

LogoMark.displayName = 'LogoMark'
