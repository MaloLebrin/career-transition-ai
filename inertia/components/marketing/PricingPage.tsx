import React from 'react'
import PublicLayout from '../layout/PublicLayout'
import AppLink from '../ui/AppLink'
import { buttonClassName } from '../ui/Button'
import { SectionHeading } from '../ui/SectionHeading'
import { CtaBand } from './CtaBand'
import { MarketingDemoSection } from './MarketingDemoSection'
import { MarketingSection } from './MarketingSection'
import { PricingTierCard, type PricingTierCardProps } from './PricingTierCard'

const TIERS: PricingTierCardProps[] = [
  {
    name: 'Essentiel',
    tagline: 'Démarrer ou petit cabinet',
    priceLabel: 'À partir de 149 €',
    priceSuffix: '/ mois HT',
    footnote: 'Jusqu’à 2 sièges conseiller · bilans actifs limités',
    features: ['Exercices et parcours candidat', 'Tableau de bord conseiller', 'Support email'],
    ctaHref: '#demo',
    ctaLabel: 'Demander un devis',
  },
  {
    name: 'Professionnel',
    tagline: 'Le plus choisi par les cabinets',
    priceLabel: 'À partir de 349 €',
    priceSuffix: '/ mois HT',
    footnote: 'Jusqu’à 8 sièges · volume bilans élargi',
    features: [
      'Tout Essentiel',
      'Rapports et synthèses avancés',
      'Onboarding équipe (1 session)',
      'Support prioritaire',
    ],
    ctaHref: '#demo',
    ctaLabel: 'Demander un devis',
    featured: true,
  },
  {
    name: 'Cabinet+',
    tagline: 'Volume, multi-sites, intégrations',
    priceLabel: 'Sur mesure',
    priceSuffix: 'nous contacter',
    footnote: 'Sièges illimités ou forfait bilan — conditions sur devis',
    features: [
      'Tout Professionnel',
      'SSO / provisioning (selon besoin)',
      'SLA et référent dédié',
      'Formation et accompagnement renforcés',
    ],
    ctaHref: '#demo',
    ctaLabel: 'Parler à un conseiller',
  },
]

const FAQ = [
  {
    question: 'Y a-t-il une période d’essai ?',
    answer:
      'Nous privilégions une démo cadrée puis un pilote court selon votre contexte. Indiquez-le dans votre message : nous adaptons la proposition.',
  },
  {
    question: 'Comment sont comptés les sièges ?',
    answer:
      'Un siège correspond à un conseiller actif sur la plateforme. Les candidats / salariés accompagnés ne sont pas facturés comme sièges.',
  },
  {
    question: 'Puis-je résilier ou changer d’offre ?',
    answer:
      'Oui, les conditions d’engagement et de résiliation sont précisées au devis (souvent engagement annuel avec flexibilité à l’échéance).',
  },
  {
    question: 'La TVA s’applique-t-elle ?',
    answer:
      'Selon votre statut et le lieu de facturation. Les montants affichés sont HT ; la TVA éventuelle est indiquée sur le devis.',
  },
]

export default function PricingPage() {
  return (
    <PublicLayout>
      <MarketingSection tone="canvas">
        <SectionHeading
          level={1}
          size="display-lg"
          align="center"
          eyebrow="Tarifs pour cabinets et organismes"
          title="Des offres claires, adaptées à votre volume."
          description="Prix indicatifs hors taxes, facturation au choix (mensuelle ou annuelle). Le devis final intègre vos besoins en sièges conseiller, bilans actifs et options."
        />
        <p className="mt-4 text-center text-sm text-muted">
          Montants indicatifs, devis personnalisé sous 48h ouvrées.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <PricingTierCard key={tier.name} {...tier} />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection tone="surface" size="narrow">
        <SectionHeading title="Questions fréquentes" size="display-sm" />
        <dl className="mt-8 divide-y divide-hairline">
          {FAQ.map((item) => (
            <div key={item.question} className="py-5 first:pt-0 last:pb-0">
              <dt className="font-semibold text-ink">{item.question}</dt>
              <dd className="mt-2 text-sm text-muted">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </MarketingSection>

      <MarketingDemoSection
        id="demo"
        tone="soft"
        eyebrow="Devis personnalisé"
        title="Affinons le bon niveau pour votre cabinet."
        description="Décrivez votre organisation et votre volume : nous revenons vers vous avec une grille tarifaire adaptée (sièges, bilans, options)."
      >
        <AppLink href="/offre" className="text-sm font-medium text-primary hover:underline">
          Voir l’offre détaillée
        </AppLink>
      </MarketingDemoSection>

      <CtaBand
        title="Une question sur la facturation ?"
        description="Écrivez-nous ou demandez une démo : nous vous proposons une grille claire, sans surprise."
        actions={
          <>
            <a href="#demo" className={buttonClassName({ variant: 'primary', size: 'lg' })}>
              Demander un devis
            </a>
            <AppLink
              href="/offre"
              className={buttonClassName({
                variant: 'outline',
                size: 'lg',
                className: 'border-on-ink/30 bg-transparent text-on-ink hover:bg-on-ink/10',
              })}
            >
              Découvrir l’offre
            </AppLink>
          </>
        }
      />
    </PublicLayout>
  )
}
