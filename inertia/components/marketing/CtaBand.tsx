import React from 'react'
import { Container } from '~/components/ui/Container'
import { SectionHeading } from '~/components/ui/SectionHeading'

export interface CtaBandProps {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  /** Boutons ou liens-boutons. */
  actions: React.ReactNode
}

/** Bande d'appel à l'action sur surface ink, en fin de page marketing. */
export const CtaBand: React.FC<CtaBandProps> = ({ eyebrow, title, description, actions }) => (
  <section className="py-16 md:py-24">
    <Container>
      <div className="rounded-2xl bg-ink px-6 py-12 text-on-ink md:px-16 md:py-16">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            description={description}
            tone="inverse"
            size="display-md"
          />
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">{actions}</div>
        </div>
      </div>
    </Container>
  </section>
)
