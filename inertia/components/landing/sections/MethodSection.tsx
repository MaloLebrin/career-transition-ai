import { ArrowRight, ListChecks, ShieldCheck, Sparkles } from 'lucide-react'
import React from 'react'
import { FeatureCard } from '~/components/marketing/FeatureCard'
import { MarketingSection } from '~/components/marketing/MarketingSection'
import AppLink from '~/components/ui/AppLink'
import { Reveal } from '~/components/ui/Reveal'
import { SectionHeading } from '~/components/ui/SectionHeading'

const FEATURES = [
  {
    tint: 'lake' as const,
    icon: <ListChecks size={20} />,
    title: 'Un parcours par étapes',
    description:
      'Chaque bilan suit la même trame : exercices, entretiens, synthèse. Le conseiller entre en séance avec une structure, jamais une page blanche.',
  },
  {
    tint: 'lavender' as const,
    icon: <Sparkles size={20} />,
    title: 'Une synthèse assistée, relue par le conseiller',
    description:
      'L’IA propose une première lecture des réponses, sépare faits, hypothèses et recommandations. Le conseiller corrige, nuance, puis restitue.',
  },
  {
    tint: 'meadow' as const,
    icon: <ShieldCheck size={20} />,
    title: 'Des données protégées',
    description:
      'Noms et e-mails sont retirés avant tout envoi à l’IA, les fichiers des candidats restent privés, et tout est hébergé dans l’Union européenne.',
  },
]

/** Les trois piliers de la méthode, avec renvoi vers la page méthodologie. */
export const MethodSection: React.FC = () => (
  <MarketingSection tone="apricot" id="methode" className="scroll-mt-16">
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="La méthode"
          title="Plus qu’un outil, une méthode structurée."
          description="Nous avons transposé les outils du bilan de compétences en un parcours qui tient la route d’un cabinet à l’autre, sans gommer la relation d’accompagnement."
        />
        <AppLink
          href="/methodologie"
          className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-accent hover:underline"
        >
          Lire la méthodologie
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </AppLink>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 120} className="h-full">
            <FeatureCard {...feature} />
          </Reveal>
        ))}
      </div>
    </div>
  </MarketingSection>
)
