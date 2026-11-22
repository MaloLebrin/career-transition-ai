import React from 'react'
import { SectionHeading } from '~/components/ui/SectionHeading'
import { MarketingSection } from '../MarketingSection'
import { brandPastel } from '../tints'

const STEPS = [
  {
    title: 'Créez votre compte en deux minutes',
    description: 'Une adresse e-mail, un mot de passe, et vous commencez tout de suite.',
  },
  {
    title: 'Faites les exercices offerts',
    description: 'Vos motivations et vos valeurs : résultats visibles immédiatement.',
  },
  {
    title: 'Débloquez la suite si elle vous parle',
    description: 'Les autres exercices, puis votre synthèse de parcours en PDF.',
  },
]

/** « Comment ça marche » : trois cartes jaune pâle, numéros dans les pastels 1, 2 et 3. */
export const HomeSteps: React.FC = () => (
  <MarketingSection tone="canvas" className="pb-8 md:pb-10">
    <div className="flex flex-col gap-10">
      <SectionHeading eyebrow="Comment ça marche" title="Trois étapes, aucune pression." />
      <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {STEPS.map((step, index) => {
          const tint = brandPastel(index)
          return (
            <li key={step.title} className="flex flex-col gap-3 rounded-2xl bg-surface-soft p-6">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full font-extrabold ${tint.surface} ${tint.ink}`}
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <h3 className="text-title-md">{step.title}</h3>
              <p className="text-sm text-muted">{step.description}</p>
            </li>
          )
        })}
      </ol>
    </div>
  </MarketingSection>
)
