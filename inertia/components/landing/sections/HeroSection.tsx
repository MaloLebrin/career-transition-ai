import { Check } from 'lucide-react'
import React from 'react'
import { MarketingSection } from '~/components/marketing/MarketingSection'
import { ProductMockup } from '~/components/marketing/ProductMockup'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName } from '~/components/ui/Button'
import { SectionHeading } from '~/components/ui/SectionHeading'

const PROOF_POINTS = [
  'Huit exercices issus des sciences comportementales',
  'Données pseudonymisées avant tout traitement par l’IA',
  'Hébergement et traitements dans l’Union européenne',
]

/** Hero de la page d'accueil : promesse, deux actions, points de preuve, aperçu du produit. */
export const HeroSection: React.FC = () => (
  <MarketingSection tone="canvas" className="pt-12 md:pt-20">
    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="space-y-8 lg:col-span-7">
        <SectionHeading
          level={1}
          size="display-xl"
          eyebrow="Pour les cabinets de transition professionnelle"
          title="Structurez vos bilans de compétences, sans perdre la nuance."
          description="Transition Carrière donne à vos conseillers un parcours d’exercices prêts à l’emploi, une synthèse assistée par l’IA et des livrables clairs. Le conseiller reste celui qui décide."
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href="#demo" className={buttonClassName({ variant: 'primary', size: 'lg' })}>
            Demander une démo
          </a>
          <AppLink
            href="/methodologie"
            className={buttonClassName({ variant: 'outline', size: 'lg' })}
          >
            Voir la méthodologie
          </AppLink>
        </div>
        <ul className="flex flex-col gap-2 border-t border-hairline pt-6 text-sm text-muted sm:flex-row sm:flex-wrap sm:gap-x-6">
          {PROOF_POINTS.map((point) => (
            <li key={point} className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      </div>
      <div className="lg:col-span-5">
        <ProductMockup />
      </div>
    </div>
  </MarketingSection>
)
