import React from 'react'
import { Container, type ContainerSize } from '~/components/ui/Container'

export type MarketingSectionTone = 'canvas' | 'surface' | 'soft' | 'ink'

export interface MarketingSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  tone?: MarketingSectionTone
  size?: ContainerSize
  children: React.ReactNode
}

const TONES: Record<MarketingSectionTone, string> = {
  canvas: 'bg-canvas',
  surface: 'bg-surface border-y border-hairline',
  soft: 'bg-surface-soft',
  ink: 'bg-ink text-on-ink',
}

/** Bande de page marketing : rythme vertical 80/96 px, surfaces alternées. */
export const MarketingSection: React.FC<MarketingSectionProps> = ({
  tone = 'canvas',
  size = 'marketing',
  className = '',
  children,
  ...props
}) => (
  <section className={`py-16 md:py-24 ${TONES[tone]} ${className}`.trim()} {...props}>
    <Container size={size}>{children}</Container>
  </section>
)
