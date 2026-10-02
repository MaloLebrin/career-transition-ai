import React from 'react'

export type EyebrowTone =
  | 'accent'
  | 'muted'
  | 'inverse'
  /** @deprecated utiliser `accent` */
  | 'primary'

type ResolvedEyebrowTone = Exclude<EyebrowTone, 'primary'>

export interface EyebrowProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
  tone?: EyebrowTone
  icon?: React.ReactNode
}

const TONES: Record<ResolvedEyebrowTone, string> = {
  accent: 'text-accent',
  muted: 'text-muted',
  inverse: 'text-accent-on-ink',
}

function resolveTone(tone: EyebrowTone): ResolvedEyebrowTone {
  return tone === 'primary' ? 'accent' : tone
}

/** Sur-titre de section, 14px/500, en casse de phrase (jamais d'uppercase), couleur accent. */
export const Eyebrow: React.FC<EyebrowProps> = ({
  children,
  tone = 'accent',
  icon,
  className = '',
  ...props
}) => (
  <p
    className={`inline-flex items-center gap-2 text-eyebrow ${TONES[resolveTone(tone)]} ${className}`.trim()}
    {...props}
  >
    {icon && (
      <span className="shrink-0" aria-hidden="true">
        {icon}
      </span>
    )}
    {children}
  </p>
)
