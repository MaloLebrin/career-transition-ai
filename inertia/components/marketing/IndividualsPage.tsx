import { usePage } from '@inertiajs/react'
import { Gift, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import React from 'react'
import { B2C_PUBLIC_PATHS } from '#shared/constants/b2c'
import { CABINETS_ACTION } from '~/config/marketing'
import PublicLayout from '../layout/PublicLayout'
import AppLink from '../ui/AppLink'
import { buttonClassName } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import { BulletList } from './BulletList'
import { CtaBand } from './CtaBand'
import { ExerciseCatalogue } from './ExerciseCatalogue'
import { FeatureCard } from './FeatureCard'
import { MarketingDemoSection } from './MarketingDemoSection'
import { MarketingSection } from './MarketingSection'
import { FREE_TITLE, LINK_CLASS, TOTAL_WORD } from './individuals/copy'
import { IndividualsHero } from './individuals/IndividualsHero'
import { ResultsPlanCard } from './individuals/ResultsPlanCard'

const FEATURES = [
  {
    icon: <Gift size={20} />,
    title: FREE_TITLE,
    description:
      'Motivations et Valeurs, avec leurs résultats et leur analyse, sans carte bancaire ni engagement.',
  },
  {
    icon: <Sparkles size={20} />,
    title: 'Un forfait, une fois',
    description: `Débloquez les ${TOTAL_WORD} exercices, les analyses IA et votre synthèse de parcours avec un paiement unique.`,
  },
  {
    icon: <UserRound size={20} />,
    title: 'Un expert si vous le souhaitez',
    description:
      'Une fois le forfait réglé, demandez à être accompagné par un expert qui suit votre parcours.',
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

  return (
    <PublicLayout>
      <IndividualsHero registrationOpen={registrationOpen} />

      <MarketingSection tone="surface">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 100}>
              <FeatureCard {...feature} className="transition-transform hover:-translate-y-1" />
            </Reveal>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection tone="canvas" id="parcours" className="scroll-mt-16">
        <div className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="Le parcours"
            title={`${TOTAL_WORD.charAt(0).toUpperCase()}${TOTAL_WORD.slice(1)} exercices pour y voir clair.`}
            description="Du diagnostic des motivations à la cartographie des compétences, chaque exercice alimente votre synthèse de parcours."
          />
          <Reveal>
            <ExerciseCatalogue />
          </Reveal>
        </div>
      </MarketingSection>

      <MarketingSection tone="surface">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-8">
            <SectionHeading
              eyebrow="Comment ça marche"
              title="Trois étapes, aucune pression."
              description="Vous avancez quand vous voulez. Les exercices offerts restent acquis, que vous débloquiez la suite ou non."
            />
            <BulletList items={STEPS} />
          </div>
          <Reveal delay={150}>
            <ResultsPlanCard />
          </Reveal>
        </div>
      </MarketingSection>

      <MarketingSection tone="canvas">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="space-y-4 lg:col-span-5">
            <SectionHeading
              eyebrow="Confiance"
              title="Des données personnelles, traitées avec soin."
              description="Un bilan de carrière touche à l’intime. Voici comment vos réponses sont protégées."
            />
            <AppLink href="/securite" className={LINK_CLASS}>
              Lire la page sécurité
            </AppLink>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:col-span-7">
            {TRUST.map((item, index) => (
              <Reveal key={item.title} delay={index * 100}>
                <FeatureCard icon={<ShieldCheck size={20} />} {...item} />
              </Reveal>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection tone="soft">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeading
            title="Vous accompagnez des candidats ?"
            description="Les cabinets de transition professionnelle ont leur propre espace : parcours d’exercices, synthèse assistée par l’IA et livrables clairs."
            size="display-sm"
          />
          <AppLink
            href={CABINETS_ACTION.href}
            className={buttonClassName({ variant: 'outline', size: 'lg' })}
          >
            Découvrir l’espace cabinet
          </AppLink>
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
