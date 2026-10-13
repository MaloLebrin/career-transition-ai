import React from 'react'
import type { CompanionPalette, EyeKind } from './types'

/** Lentille principale et petite lentille : l'expression tient à la paupière et au regard. */
export const Eyes: React.FC<{ kind: EyeKind; p: CompanionPalette; animated: boolean }> = ({
  kind,
  p,
  animated,
}) => {
  const dy = kind === 'up' ? -3 : 0
  return (
    <g data-face="eyes" className={animated && kind !== 'happy' ? 'companion-blink' : undefined}>
      <circle cx="88" cy={52 + dy} r="10" fill={p.metal} />
      <circle cx="88" cy={52 + dy} r="8" fill={p.line} />
      <circle cx="85" cy={49 + dy} r="2.5" fill={p.highlight} />
      {kind === 'happy' && <path d="M78 54 a10 10 0 0 0 20 0 z" fill={p.shell} opacity="0.9" />}
      {kind === 'squint' && <rect x="77" y="41" width="22" height="9" fill={p.shell} />}
      <circle cx="112" cy={60 + dy} r="4.5" fill={p.metal} />
      <circle cx="112" cy={60 + dy} r="3" fill={p.lens} />
    </g>
  )
}

/** Un panneau orange : anneau plein, disque central, découpé par la sphère. */
export const Panel: React.FC<{ cx: number; cy: number; r: number; p: CompanionPalette }> = ({
  cx,
  cy,
  r,
  p,
}) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="none" stroke={p.panel} strokeWidth={r * 0.34} />
    <circle cx={cx} cy={cy} r={r * 0.3} fill={p.panel} />
  </g>
)

export const Padlock: React.FC<{ p: CompanionPalette }> = ({ p }) => (
  <g data-prop="padlock">
    <path d="M166 156 v-8 a8 8 0 0 1 16 0 v8" fill="none" stroke={p.stroke} strokeWidth="4" />
    <rect x="158" y="154" width="32" height="26" rx="6" fill={p.lock} />
    <rect
      x="158"
      y="154"
      width="32"
      height="26"
      rx="6"
      fill="none"
      stroke={p.stroke}
      strokeWidth="3"
    />
    <circle cx="174" cy="166" r="3.5" fill={p.shell} />
  </g>
)

/** La pousse dans son pot, posée à côté du droïde. */
export const Sprout: React.FC<{ p: CompanionPalette }> = ({ p }) => (
  <g data-prop="sprout">
    <path
      d="M12 160 h22 l-3 20 h-16 z"
      fill={p.panel}
      stroke={p.stroke}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path d="M23 160 v-18" fill="none" stroke={p.leaf} strokeWidth="4" strokeLinecap="round" />
    <ellipse cx="15" cy="146" rx="8" ry="4" fill={p.leaf} transform="rotate(-30 15 146)" />
    <ellipse cx="31" cy="140" rx="8" ry="4" fill={p.leaf} transform="rotate(30 31 140)" />
  </g>
)

export const Bubble: React.FC<{ p: CompanionPalette }> = ({ p }) => (
  <g data-prop="bubble" fill={p.shell} stroke={p.stroke} strokeWidth="3">
    <circle cx="148" cy="40" r="4" />
    <circle cx="160" cy="28" r="6" />
    <circle cx="176" cy="14" r="9" />
  </g>
)

const SPARKLE = 'M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z'

export const Sparkles: React.FC<{ p: CompanionPalette; animated: boolean }> = ({ p, animated }) => (
  <g data-prop="sparkles" fill={p.panel}>
    <path
      d={SPARKLE}
      transform="translate(40 40)"
      className={animated ? 'companion-sparkle' : undefined}
    />
    <path
      d={SPARKLE}
      transform="translate(164 30) scale(1.3)"
      className={animated ? 'companion-sparkle companion-sparkle-b' : undefined}
    />
    <path
      d={SPARKLE}
      transform="translate(170 110) scale(0.8)"
      className={animated ? 'companion-sparkle companion-sparkle-c' : undefined}
    />
  </g>
)
