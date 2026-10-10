import { FileText, Sparkles, Users } from 'lucide-react'
import React from 'react'
import { EXERCISE_LIST } from '#shared/constants/exercises'
import PublicLayout from '~/components/layout/PublicLayout'
import { CtaBand } from '~/components/marketing/CtaBand'
import { ExerciseCatalogue } from '~/components/marketing/ExerciseCatalogue'
import { FeatureTabs, type FeatureTab } from '~/components/marketing/FeatureTabs'
import { KeyFactsStrip } from '~/components/marketing/KeyFactsStrip'
import { MarketingDemoSection } from '~/components/marketing/MarketingDemoSection'
import { MarketingSection } from '~/components/marketing/MarketingSection'
import { AdvisorDashboardMockup } from '~/components/marketing/mockups/AdvisorDashboardMockup'
import { AiAnalysisMockup } from '~/components/marketing/mockups/AiAnalysisMockup'
import { SynthesisMockup } from '~/components/marketing/mockups/SynthesisMockup'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName } from '~/components/ui/Button'
import { SectionHeading } from '~/components/ui/SectionHeading'
import { CABINET_HEADER } from '~/config/marketing'
import { AiSection } from './sections/AiSection'
import { HeroSection } from './sections/HeroSection'
import { MethodSection } from './sections/MethodSection'

const ADVISOR_TABS: FeatureTab[] = [
  {
    label: 'Suivi des candidats',
    icon: Users,
    tint: 'lake',
    title: 'Chaque parcours, d’un coup d’œil',
    description:
      'Vos candidats avancent dans les exercices entre les séances ; vous voyez où chacun en est avant de le recevoir.',
    points: ['Progression par exercice', 'Une équipe, plusieurs conseillers'],
    visual: <AdvisorDashboardMockup />,
  },
  {
    label: 'Synthèse assistée',
    icon: Sparkles,
    tint: 'lavender',
    title: 'Une première lecture, que vous relisez',
    description:
      'L’IA met en forme les réponses et relève les thèmes saillants. Vous corrigez, nuancez, puis validez.',
    points: ['Données pseudonymisées', 'Le conseiller valide'],
    visual: <AiAnalysisMockup reviewed />,
  },
  {
    label: 'Livrables',
    icon: FileText,
    tint: 'apricot',
    title: 'Des restitutions claires, prêtes à partager',
    description:
      'La synthèse de parcours réunit les résultats et vos conclusions dans un document exportable en PDF.',
    points: ['Export PDF', 'Résultats et conclusions réunis'],
    visual: <SynthesisMockup />,
  },
]

/** Accueil de l'espace cabinet (`/cabinets`) : promesse, parcours, méthode, IA, démo. */
const CabinetLandingPage: React.FC = () => (
  <PublicLayout header={CABINET_HEADER}>
    <HeroSection />

    <KeyFactsStrip
      facts={[
        { value: EXERCISE_LIST.length, label: 'exercices prêts à l’emploi' },
        { value: 0, label: 'nom ou e-mail de candidat transmis à l’IA' },
        {
          value: 100,
          format: (n) => `${Math.round(n)} %`,
          label: 'hébergé dans l’Union européenne',
        },
        { value: '48 h', label: 'ouvrées pour répondre à votre demande' },
      ]}
    />

    <MarketingSection tone="canvas">
      <div className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="Le quotidien du conseiller"
          title="Moins de mise en forme, plus d’écoute."
          description="Le suivi, la synthèse et les livrables au même endroit, pour que les séances servent à ce qui compte."
        />
        <FeatureTabs tabs={ADVISOR_TABS} />
      </div>
    </MarketingSection>

    <MarketingSection tone="surface" id="parcours">
      <div className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Le parcours"
          title="Huit exercices prêts à l’emploi."
          description="Du diagnostic des motivations à la cartographie des compétences, chaque exercice alimente la synthèse finale et le plan d’action du candidat."
        />
        <ExerciseCatalogue />
      </div>
    </MarketingSection>

    <MethodSection />
    <AiSection />

    <MarketingDemoSection
      id="demo"
      tone="sky"
      title="Voyons si c’est un fit pour votre cabinet."
      description="Décrivez votre organisation et vos attentes : nous revenons vers vous sous 48h ouvrées avec une proposition adaptée."
    />

    <CtaBand
      eyebrow="Pour aller plus loin"
      title="Prêt à structurer vos accompagnements ?"
      description="Une démo cadrée, puis un pilote court avec votre équipe."
      actions={
        <>
          <a href="#demo" className={buttonClassName({ variant: 'secondary', size: 'lg' })}>
            Demander une démo
          </a>
          <AppLink
            href="/cabinets/tarifs"
            className={buttonClassName({
              variant: 'outline',
              size: 'lg',
              className: 'border-on-ink/30 bg-transparent text-on-ink hover:bg-on-ink/10',
            })}
          >
            Voir les tarifs
          </AppLink>
        </>
      }
    />
  </PublicLayout>
)

export default CabinetLandingPage
