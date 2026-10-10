import { usePage } from '@inertiajs/react'
import { FileText, ListChecks, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import React from 'react'
import { B2C_FREE_EXERCISE_TYPES, B2C_PUBLIC_PATHS } from '#shared/constants/b2c'
import { EXERCISE_LIST } from '#shared/constants/exercises'
import { CABINETS_ACTION } from '~/config/marketing'
import { useResultsPriceLabel } from '~/hooks/use_results_price_label'
import PublicLayout from '../layout/PublicLayout'
import AppLink from '../ui/AppLink'
import { buttonClassName } from '../ui/Button'
import { RevealGroup } from '../ui/motion/RevealGroup'
import { RevealItem } from '../ui/motion/RevealItem'
import { TiltCard } from '../ui/motion/TiltCard'
import { SectionHeading } from '../ui/SectionHeading'
import { CtaBand } from './CtaBand'
import { ExerciseCatalogue } from './ExerciseCatalogue'
import { FeatureCard } from './FeatureCard'
import { FeatureTabs, type FeatureTab } from './FeatureTabs'
import { KeyFactsStrip } from './KeyFactsStrip'
import { MarketingDemoSection } from './MarketingDemoSection'
import { MarketingSection } from './MarketingSection'
import { PrivacyFlow } from './PrivacyFlow'
import { StepsTimeline } from './StepsTimeline'
import { FREE_TITLE, LINK_CLASS, TOTAL_WORD } from './individuals/copy'
import { IndividualsHero } from './individuals/IndividualsHero'
import { ResultsPlanCard } from './individuals/ResultsPlanCard'
import { AiAnalysisMockup } from './mockups/AiAnalysisMockup'
import { ExpertMockup } from './mockups/ExpertMockup'
import { JourneyMockup } from './mockups/JourneyMockup'
import { SynthesisMockup } from './mockups/SynthesisMockup'

const FEATURE_TABS: FeatureTab[] = [
  {
    label: 'Les exercices',
    icon: ListChecks,
    tint: 'lake',
    title: `${TOTAL_WORD.charAt(0).toUpperCase()}${TOTAL_WORD.slice(1)} exercices, à votre rythme`,
    description: `${FREE_TITLE} pour commencer, sans carte bancaire. Vous reprenez où vous vous êtes arrêté.`,
    points: ['Sauvegarde automatique', 'Résultats immédiats'],
    visual: <JourneyMockup />,
  },
  {
    label: 'L’analyse IA',
    icon: Sparkles,
    tint: 'blossom',
    title: 'Une lecture de vos réponses, exercice par exercice',
    description:
      'L’IA met en évidence les thèmes saillants de vos réponses. Votre nom et votre e-mail ne lui sont jamais transmis.',
    points: ['Réponses pseudonymisées', 'Thèmes saillants'],
    visual: <AiAnalysisMockup />,
  },
  {
    label: 'La synthèse',
    icon: FileText,
    tint: 'apricot',
    title: 'Votre synthèse de parcours, prête à partager',
    description:
      'Tous vos résultats réunis en un document clair, à exporter en PDF pour préparer la suite.',
    points: ['Export PDF', 'Vue d’ensemble'],
    visual: <SynthesisMockup />,
  },
  {
    label: 'Un expert',
    icon: UserRound,
    tint: 'lavender',
    title: 'Un expert à vos côtés, si vous le souhaitez',
    description:
      'Une fois le forfait réglé, demandez à être accompagné par un expert qui suit votre parcours.',
    points: ['Sur demande', 'Sans engagement'],
    visual: <ExpertMockup />,
  },
]

const STEPS = [
  {
    title: 'Créez votre compte en deux minutes',
    description: 'Une adresse e-mail, un mot de passe, et vous commencez tout de suite.',
  },
  {
    title: 'Faites les exercices offerts',
    description:
      'Clarifiez vos motivations et vos valeurs : vos résultats sont visibles immédiatement.',
  },
  {
    title: 'Débloquez la suite si elle vous parle',
    description:
      'Personnalité, courbe de vie, ciblage, cartographie des compétences… puis votre synthèse.',
  },
]

const TRUST = [
  {
    title: 'Pseudonymisées avant l’IA',
    description: 'Votre nom et votre e-mail ne sont jamais transmis aux modèles d’analyse.',
  },
  {
    title: 'Hébergées dans l’Union européenne',
    description: 'Hébergement et traitements dans l’Union européenne.',
  },
  {
    title: 'Vos données, votre décision',
    description:
      'Exportez vos données ou demandez leur effacement depuis votre profil, sans passer par un tiers.',
  },
]

/**
 * Accueil public `/` : parcours particulier (épic B2C #99). Le CTA renvoie vers
 * l'inscription quand elle est ouverte (`b2cRegistrationEnabled`), vers la liste
 * d'attente sinon. Les cabinets ont leur espace sur `/cabinets`.
 */
export default function IndividualsPage() {
  const { props } = usePage<{ b2cRegistrationEnabled?: boolean }>()
  const registrationOpen = Boolean(props.b2cRegistrationEnabled)
  const priceLabel = useResultsPriceLabel()

  return (
    <PublicLayout>
      <IndividualsHero registrationOpen={registrationOpen} />

      <KeyFactsStrip
        facts={[
          { value: EXERCISE_LIST.length, label: 'exercices issus des sciences comportementales' },
          {
            value: B2C_FREE_EXERCISE_TYPES.length,
            label: 'exercices offerts, sans carte bancaire',
          },
          { value: priceLabel, label: 'le forfait, payé une seule fois' },
          {
            value: 100,
            format: (n) => `${Math.round(n)} %`,
            label: 'hébergé dans l’Union européenne',
          },
        ]}
      />

      <MarketingSection tone="canvas">
        <div className="flex flex-col gap-12">
          <SectionHeading
            eyebrow="Ce que vous obtenez"
            title="Tout pour y voir clair, au même endroit."
            description="Des exercices pour vous connaître, une analyse pour prendre du recul, une synthèse pour décider. Et quelqu’un à qui parler si vous le souhaitez."
          />
          <FeatureTabs tabs={FEATURE_TABS} />
        </div>
      </MarketingSection>

      <MarketingSection tone="surface" id="parcours" className="scroll-mt-16">
        <div className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="Le parcours"
            title={`${TOTAL_WORD.charAt(0).toUpperCase()}${TOTAL_WORD.slice(1)} exercices pour y voir clair.`}
            description="Du diagnostic des motivations à la cartographie des compétences, chaque exercice alimente votre synthèse de parcours."
          />
          <ExerciseCatalogue />
        </div>
      </MarketingSection>

      <MarketingSection tone="canvas">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-10">
            <SectionHeading
              eyebrow="Comment ça marche"
              title="Trois étapes, aucune pression."
              description="Vous avancez quand vous voulez. Les exercices offerts restent acquis, que vous débloquiez la suite ou non."
            />
            <StepsTimeline steps={STEPS} />
          </div>
          <RevealGroup className="lg:pt-24">
            <RevealItem>
              <TiltCard>
                <ResultsPlanCard />
              </TiltCard>
            </RevealItem>
          </RevealGroup>
        </div>
      </MarketingSection>

      <MarketingSection tone="soft">
        <div className="flex flex-col gap-12">
          <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <SectionHeading
                eyebrow="Confiance"
                title="Des données personnelles, traitées avec soin."
                description="Un bilan de carrière touche à l’intime. Voici comment vos réponses sont protégées."
              />
              <AppLink href="/securite" className={LINK_CLASS}>
                Lire la page sécurité
              </AppLink>
            </div>
            <div className="lg:col-span-5">
              <PrivacyFlow />
            </div>
          </div>
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {TRUST.map((item) => (
              <RevealItem key={item.title}>
                <FeatureCard icon={<ShieldCheck size={20} />} {...item} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </MarketingSection>

      <MarketingSection tone="canvas">
        <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface p-8 shadow-card md:p-12">
          <div
            className="pointer-events-none absolute inset-0 bg-grid-hairline opacity-40 [mask-image:linear-gradient(to_left,black,transparent_60%)]"
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeading
              title="Vous accompagnez des candidats ?"
              description="Les cabinets de transition professionnelle ont leur propre espace : parcours d’exercices, synthèse assistée par l’IA et livrables clairs."
              size="display-sm"
            />
            <AppLink
              href={CABINETS_ACTION.href}
              className={buttonClassName({ variant: 'outline', size: 'lg', className: 'shrink-0' })}
            >
              Découvrir l’espace cabinet
            </AppLink>
          </div>
        </div>
      </MarketingSection>

      {!registrationOpen && (
        <MarketingDemoSection
          id="contact"
          tone="surface"
          variant="contact"
          eyebrow="Bientôt disponible"
          title="L’inscription des particuliers ouvre prochainement."
          description="Laissez-nous votre adresse : nous vous prévenons dès que vous pourrez commencer les exercices offerts."
        />
      )}

      <CtaBand
        eyebrow="Pour les particuliers"
        title={`${FREE_TITLE} pour commencer.`}
        description="Pas de carte bancaire, pas d’engagement. Vous décidez ensuite si la suite vaut le forfait."
        actions={
          registrationOpen ? (
            <>
              <AppLink
                href={B2C_PUBLIC_PATHS.register}
                className={buttonClassName({ variant: 'secondary', size: 'lg' })}
              >
                Commencer gratuitement
              </AppLink>
              <AppLink
                href={B2C_PUBLIC_PATHS.pricing}
                className={buttonClassName({
                  variant: 'outline',
                  size: 'lg',
                  className: 'border-on-ink/30 bg-transparent text-on-ink hover:bg-on-ink/10',
                })}
              >
                Voir le tarif
              </AppLink>
            </>
          ) : (
            <a href="#contact" className={buttonClassName({ variant: 'secondary', size: 'lg' })}>
              Être prévenu de l’ouverture
            </a>
          )
        }
      />
    </PublicLayout>
  )
}
