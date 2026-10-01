import React from 'react'

export type EyebrowTone = 'primary' | 'muted' | 'inverse'

export interface EyebrowProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
  tone?: EyebrowTone
  icon?: React.ReactNode
}

const TONES: Record<EyebrowTone, string> = {
  primary: 'text-primary',
  muted: 'text-muted',
  inverse: 'text-primary-on-ink',
}

/** Sur-titre de section, 14px/500, en casse de phrase (jamais d'uppercase). */
export const Eyebrow: React.FC<EyebrowProps> = ({
  children,
  tone = 'primary',
  icon,
  className = '',
  ...props
}) => (
  <p
    className={`inline-flex items-center gap-2 text-eyebrow ${TONES[tone]} ${className}`.trim()}
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
