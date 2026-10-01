import React from 'react'
import Card from '~/components/ui/Card'
import { SectionHeading } from '~/components/ui/SectionHeading'
import { ContactDemoForm, type ContactDemoFormVariant } from './ContactDemoForm'
import { MarketingSection, type MarketingSectionTone } from './MarketingSection'

export interface MarketingDemoSectionProps {
  id?: string
  tone?: MarketingSectionTone
  variant?: ContactDemoFormVariant
  eyebrow?: string
  title: React.ReactNode
  description: React.ReactNode
  /** Contenu optionnel sous la description (liens, précisions). */
  children?: React.ReactNode
}

/** Bloc deux colonnes « demandez une démo » + formulaire, commun aux pages marketing. */
export const MarketingDemoSection: React.FC<MarketingDemoSectionProps> = ({
  id = 'demo',
  tone = 'surface',
  variant = 'demo',
  eyebrow = 'Demander une démo',
  title,
  description,
  children,
}) => (
  <MarketingSection id={id} tone={tone} className="scroll-mt-16">
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="space-y-6 lg:col-span-5">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        {children}
      </div>
      <Card padding="md" className="lg:col-span-7 md:p-8">
        <ContactDemoForm variant={variant} title="" description="" />
      </Card>
    </div>
  </MarketingSection>
)
