import React from 'react'
import { Container } from '~/components/ui/Container'
import { useResultsPriceLabel } from '~/hooks/use_results_price_label'
import { TOTAL_WORD } from '../individuals/copy'
import { StartAction } from './StartAction'

interface PlanBandProps {
  registrationOpen: boolean
}

/**
 * Le forfait, seul bloc prix de l'accueil (planche 47) : bandeau vert foncé (`tint-lake-ink`,
 * texte blanc 6,5:1, sur-titre `sun-soft` 5,1:1), texte à gauche, carte prix blanche à droite.
 */
export const PlanBand: React.FC<PlanBandProps> = ({ registrationOpen }) => {
  const priceLabel = useResultsPriceLabel()
  return (
    <section id="tarif" className="scroll-mt-16 bg-tint-lake-ink text-on-ink">
      <Container className="flex flex-col gap-10 py-16 md:flex-row md:items-center md:py-20">
        <div className="flex flex-1 flex-col gap-3">
          <p className="text-eyebrow text-sun-soft">Le forfait</p>
          <h2 className="text-display-md text-on-ink">Paiement unique, sans abonnement.</h2>
          <p className="max-w-xl text-surface-strong">
            Les {TOTAL_WORD} exercices et leurs résultats détaillés, l’analyse IA de chacun, votre
            synthèse en PDF, et la possibilité de demander un expert.
          </p>
        </div>
        <div
          role="group"
          aria-label="Forfait particuliers"
          className="flex flex-col items-start gap-3 rounded-2xl bg-surface p-8 text-ink shadow-raised md:w-80"
        >
          <span className="font-display text-display-lg leading-none">{priceLabel}</span>
          <span className="text-sm text-muted">TTC · payé une seule fois</span>
          <StartAction registrationOpen={registrationOpen} onHome className="mt-2" />
        </div>
      </Container>
    </section>
  )
}
