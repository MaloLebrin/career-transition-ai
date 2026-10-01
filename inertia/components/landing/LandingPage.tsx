import React from 'react'
import PublicLayout from '~/components/layout/PublicLayout'
import { CtaBand } from '~/components/marketing/CtaBand'
import { ExerciseCatalogue } from '~/components/marketing/ExerciseCatalogue'
import { MarketingDemoSection } from '~/components/marketing/MarketingDemoSection'
import { MarketingSection } from '~/components/marketing/MarketingSection'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName } from '~/components/ui/Button'
import { SectionHeading } from '~/components/ui/SectionHeading'
import { AiSection } from './sections/AiSection'
import { HeroSection } from './sections/HeroSection'
import { MethodSection } from './sections/MethodSection'

/** Page d'accueil publique : promesse, parcours, méthode, IA, démo. */
const LandingPage: React.FC = () => (
  <PublicLayout>
    <HeroSection />

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
      tone="surface"
      title="Voyons si c’est un fit pour votre cabinet."
      description="Décrivez votre organisation et vos attentes : nous revenons vers vous sous 48h ouvrées avec une proposition adaptée."
    />

    <CtaBand
      eyebrow="Pour aller plus loin"
      title="Prêt à structurer vos accompagnements ?"
      description="Une démo cadrée, puis un pilote court avec votre équipe."
      actions={
        <>
          <a href="#demo" className={buttonClassName({ variant: 'primary', size: 'lg' })}>
            Demander une démo
          </a>
          <AppLink
            href="/tarifs"
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

export default LandingPage
