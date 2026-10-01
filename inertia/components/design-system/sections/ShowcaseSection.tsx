import React from 'react'
import { SectionHeading } from '~/components/ui/SectionHeading'

export interface ShowcaseSectionProps {
  eyebrow: string
  title: string
  description?: string
  children: React.ReactNode
}

/** Bloc de la vitrine : en-tête de section + contenu. */
export const ShowcaseSection: React.FC<ShowcaseSectionProps> = ({
  eyebrow,
  title,
  description,
  children,
}) => (
  <section className="space-y-6">
    <SectionHeading eyebrow={eyebrow} title={title} description={description} size="display-sm" />
    {children}
  </section>
)
