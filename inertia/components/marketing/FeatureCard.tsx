import React from 'react'
import Card from '~/components/ui/Card'

export interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  className?: string
}

/** Carte d'argument : tuile d'icône soleil, titre, description. */
export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  className = '',
}) => (
  <Card padding="md" className={`flex h-full flex-col gap-4 ${className}`.trim()}>
    <span
      className="flex h-10 w-10 items-center justify-center rounded-lg bg-tint-sun text-ink"
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
