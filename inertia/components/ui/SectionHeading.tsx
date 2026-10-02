import React from 'react'
import { Eyebrow, type EyebrowTone } from './Eyebrow'

export type SectionHeadingSize = 'display-xl' | 'display-lg' | 'display-md' | 'display-sm'
export type SectionHeadingLevel = 1 | 2 | 3

export interface SectionHeadingProps {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  level?: SectionHeadingLevel
  size?: SectionHeadingSize
  align?: 'left' | 'center'
  tone?: 'default' | 'inverse'
  className?: string
}

const SIZES: Record<SectionHeadingSize, string> = {
  'display-xl': 'text-display-md md:text-display-lg lg:text-display-xl',
  'display-lg': 'text-display-sm md:text-display-md lg:text-display-lg',
  'display-md': 'text-display-sm md:text-display-md',
  'display-sm': 'text-title-lg md:text-display-sm',
}

/** Sur-titre + titre + description : l'en-tête standard des sections marketing. */
export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  level = 2,
  size = 'display-md',
  align = 'left',
  tone = 'default',
  className = '',
}) => {
  const Heading = `h${level}` as const
  const inverse = tone === 'inverse'
  const eyebrowTone: EyebrowTone = inverse ? 'inverse' : 'accent'
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start'

  return (
    <div className={`flex flex-col gap-3 ${alignClass} ${className}`.trim()}>
      {eyebrow && <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow>}
      <Heading
        className={`${SIZES[size]} max-w-3xl text-balance break-words ${inverse ? 'text-on-ink' : 'text-ink'}`}
      >
        {title}
      </Heading>
      {description && (
        <p className={`text-body-lg max-w-2xl ${inverse ? 'text-on-ink-soft' : 'text-muted'}`}>
          {description}
        </p>
      )}
    </div>
  )
}
