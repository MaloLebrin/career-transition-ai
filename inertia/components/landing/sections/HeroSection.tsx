import { Check } from 'lucide-react'
import React from 'react'
import { LandscapeArt } from '~/components/marketing/LandscapeArt'
import { MarketingSection } from '~/components/marketing/MarketingSection'
import { ProductMockup } from '~/components/marketing/ProductMockup'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName } from '~/components/ui/Button'
import { SectionHeading } from '~/components/ui/SectionHeading'
import { INDIVIDUALS_ACTION } from '~/config/marketing'

const PROOF_POINTS = [
  'Huit exercices issus des sciences comportementales',
  'Données pseudonymisées avant tout traitement par l’IA',
  'Hébergement et traitements dans l’Union européenne',
]

/**
 * Hero de la page d'accueil : un paysage apaisant en panorama, puis la promesse, deux
 * actions, les points de preuve et l'aperçu du produit.
 */
export const HeroSection: React.FC = () => (
  <MarketingSection tone="canvas" className="pt-8 md:pt-12">
    <div
      className="mb-12 aspect-[16/9] overflow-hidden rounded-2xl border border-hairline shadow-card md:aspect-[3/1] lg:mb-16"
      data-testid="hero-landscape"
    >
      <LandscapeArt variant="hero" />
    </div>
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
        {/* Épic B2C (#99) : les particuliers ont leur propre page, sans brouiller le message cabinet. */}
        <p className="text-sm text-muted">
          <AppLink href={INDIVIDUALS_ACTION.href} className="font-medium text-accent hover:underline">
            {INDIVIDUALS_ACTION.label}
          </AppLink>{' '}
          Découvrez le parcours en autonomie, avec deux exercices offerts.
        </p>
        <ul className="flex flex-col gap-2 border-t border-hairline pt-6 text-sm text-muted sm:flex-row sm:flex-wrap sm:gap-x-6">
          {PROOF_POINTS.map((point) => (
            <li key={point} className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
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
