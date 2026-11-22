import React from 'react'
import { Container } from '~/components/ui/Container'

export const FINAL_CALL_TITLE = 'Sautez. On tient la rampe.'

interface FinalCallProps {
  /** Le bouton (ou les boutons) d'appel. */
  action: React.ReactNode
  description?: React.ReactNode
}

/** Appel final des pages particuliers (accueil, Qui sommes-nous) : bande jaune pâle centrée. */
export const FinalCall: React.FC<FinalCallProps> = ({ action, description }) => (
  <section className="bg-surface-soft">
    <Container className="flex flex-col items-center gap-5 py-16 text-center md:py-20">
      <h2 className="text-display-md">{FINAL_CALL_TITLE}</h2>
      {description && <p className="max-w-md text-body-lg text-muted">{description}</p>}
      {action}
    </Container>
  </section>
)
