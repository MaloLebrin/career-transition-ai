import React from 'react'
import Card from '~/components/ui/Card'
import { MARKETING_TINTS, type MarketingTint } from './tints'

export interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  /** Teinte de la tuile d'icône (soleil par défaut). */
  tint?: MarketingTint
  className?: string
}

/** Carte d'argument : tuile d'icône teintée, titre, description. */
export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  tint = 'sun',
  className = '',
}) => (
  <Card padding="md" className={`flex h-full flex-col gap-4 ${className}`.trim()}>
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-lg ${MARKETING_TINTS[tint].surface} ${MARKETING_TINTS[tint].ink}`}
      aria-hidden="true"
    >
      {icon}
    </span>
    <div className="space-y-1.5">
      <h3 className="text-title-md">{title}</h3>
      <p className="text-sm leading-relaxed text-muted">{description}</p>
    </div>
  </Card>
)
