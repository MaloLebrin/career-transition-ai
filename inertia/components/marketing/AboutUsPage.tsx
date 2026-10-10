import { Brain, Compass, Lock, UserCheck } from 'lucide-react'
import { CONTACT_EMAIL, FOOTER_TAGLINE } from '~/config/marketing'
import { SELLER_IDENTITY } from '#shared/constants/legal'
import PublicLayout from '../layout/PublicLayout'
import AppLink from '../ui/AppLink'
import { buttonClassName } from '../ui/Button'
import { SectionHeading } from '../ui/SectionHeading'
import { BulletList } from './BulletList'
import { CtaBand } from './CtaBand'
import { FeatureCard } from './FeatureCard'
import { LandscapeArt } from './LandscapeArt'
import { MarketingSection } from './MarketingSection'
import { PageHero } from './PageHero'
import { RevealGroup } from '../ui/motion/RevealGroup'
import { RevealItem } from '../ui/motion/RevealItem'
import { TiltCard } from '../ui/motion/TiltCard'

const APPROACH = [
  {
    icon: <Compass size={20} />,
    title: 'Des exercices structurés',
    description:
      'Valeurs, motivations, compétences : des exercices issus des sciences comportementales pour faire le point à votre rythme.',
  },
  {
    icon: <Brain size={20} />,
    title: 'Une IA copilote',
    description:
      'L’analyse assistée par l’IA aide à synthétiser vos réponses. Elle propose des pistes, elle ne rend jamais de verdict.',
  },
  {
    icon: <UserCheck size={20} />,
    title: 'Un expert si vous le souhaitez',
    description:
      'Vous pouvez demander l’accompagnement d’un expert pour relire vos résultats et construire la suite avec vous.',
  },
]

const COMMITMENTS = [
  {
    title: 'Décision humaine',
    description: 'Les analyses restent des propositions : vous (et votre expert) arbitrez.',
  },
  {
    title: 'Confidentialité',
    description:
      'Conception orientée RGPD : les données envoyées à l’IA sont pseudonymisées et ne servent jamais à entraîner un modèle.',
  },
  {
    title: 'Transparence',
    description:
      'Nous expliquons comment fonctionnent les résultats, sans boîte noire ni promesse d’infaillibilité.',
  },
]

export default function AboutUsPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Qui sommes-nous"
        title="Aider chacun à faire le point sur sa carrière, à son rythme."
        description={FOOTER_TAGLINE}
        aside={
          <div
            className="aspect-[4/3] overflow-hidden rounded-2xl border border-hairline shadow-floating"
            data-testid="about-landscape"
          >
            <LandscapeArt variant="hero" />
          </div>
        }
      />

      <MarketingSection tone="surface">
        <SectionHeading
          eyebrow="Notre approche"
          title="Les sciences comportementales, l’IA et l’humain."
          description="Une transition de carrière se prépare avec méthode. Nous combinons trois ingrédients pour que le bilan soit clair, nuancé et utile à la décision."
        />
        <RevealGroup className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3" stagger={0.12}>
          {APPROACH.map((item, index) => (
            <RevealItem key={item.title} className="h-full">
              <TiltCard className="h-full">
                <FeatureCard
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  tint={(['lake', 'blossom', 'lavender'] as const)[index]}
                  className="h-full"
                />
              </TiltCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </MarketingSection>

      <MarketingSection tone="soft">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-4">
            <SectionHeading
              eyebrow="Nos engagements"
              title="Vos données et vos décisions vous appartiennent."
              description="Nous traitons vos informations avec soin et vous gardez toujours la main sur le sens de vos résultats."
            />
            <p className="flex items-center gap-2 text-sm text-muted">
              <Lock size={16} aria-hidden="true" />
              <span>
                En savoir plus :{' '}
                <AppLink
                  href="/securite"
                  className="font-medium text-accent underline-offset-4 hover:underline"
                >
                  sécurité
                </AppLink>{' '}
                et{' '}
                <AppLink
                  href="/confidentialite"
                  className="font-medium text-accent underline-offset-4 hover:underline"
                >
                  politique de confidentialité
                </AppLink>
                .
              </span>
            </p>
          </div>
          <BulletList items={COMMITMENTS} />
        </div>
      </MarketingSection>

      <MarketingSection tone="canvas">
        <SectionHeading
          eyebrow="Pour qui"
          title="Particuliers et cabinets de transition."
          description={
            <>
              Le parcours particulier s’adresse à toute personne qui s’interroge sur son avenir
              professionnel. Les cabinets de transition professionnelle disposent d’un espace dédié
              pour structurer et fluidifier leurs accompagnements.
            </>
          }
        />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <AppLink href="/" className={buttonClassName({ variant: 'primary', size: 'lg' })}>
            Découvrir le parcours
          </AppLink>
          <AppLink href="/cabinets" className={buttonClassName({ variant: 'outline', size: 'lg' })}>
            Espace cabinet
          </AppLink>
        </div>
        <p className="mt-10 text-sm text-muted">
          Éditeur : {SELLER_IDENTITY.name} ·{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </MarketingSection>

      <CtaBand
        title="Une question sur Transition Carrière ?"
        description="Écrivez-nous, nous revenons vers vous rapidement."
        actions={
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className={buttonClassName({ variant: 'secondary', size: 'lg' })}
          >
            Nous contacter
          </a>
        }
      />
    </PublicLayout>
  )
}
