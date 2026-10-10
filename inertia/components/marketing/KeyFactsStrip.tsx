import React from 'react'
import { CountUp } from '~/components/ui/motion/CountUp'
import { RevealGroup } from '~/components/ui/motion/RevealGroup'
import { RevealItem } from '~/components/ui/motion/RevealItem'
import { Container } from '~/components/ui/Container'

export interface KeyFact {
  /** Nombre compté au scroll, ou texte affiché tel quel. */
  value: number | string
  /** Mise en forme d'un nombre (ex. prix). */
  format?: (value: number) => string
  label: string
}

export interface KeyFactsStripProps {
  facts: KeyFact[]
  /** Nom accessible du bandeau. */
  label?: string
}

/**
 * Bandeau de chiffres clés sous un héros. Uniquement des faits produit vérifiables
 * (DESIGN.md §1) : nombre d'exercices, prix réel, hébergement…
 */
export const KeyFactsStrip: React.FC<KeyFactsStripProps> = ({ facts, label = 'Chiffres clés' }) => (
  <section aria-label={label} className="border-y border-hairline bg-surface">
    <Container>
      <RevealGroup className="grid grid-cols-2 divide-hairline md:grid-cols-4 md:divide-x">
        {facts.map((fact) => (
          <RevealItem key={fact.label} className="px-4 py-8 text-center md:py-10">
            <p className="font-display text-display-sm text-ink md:text-display-md">
              {typeof fact.value === 'number' ? (
                <CountUp value={fact.value} format={fact.format} />
              ) : (
                fact.value
              )}
            </p>
            <p className="mt-1 text-sm text-muted">{fact.label}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </Container>
  </section>
)
