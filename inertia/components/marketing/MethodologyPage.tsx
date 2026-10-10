import { FileCheck, GitBranch, Lock, UserCheck } from 'lucide-react'
import React from 'react'
import { CABINET_HEADER } from '~/config/marketing'
import PublicLayout from '../layout/PublicLayout'
import AppLink from '../ui/AppLink'
import { buttonClassName } from '../ui/Button'
import Card from '../ui/Card'
import { Eyebrow } from '../ui/Eyebrow'
import { SectionHeading } from '../ui/SectionHeading'
import { BulletList } from './BulletList'
import { CtaBand } from './CtaBand'
import { MarketingDemoSection } from './MarketingDemoSection'
import { MarketingSection } from './MarketingSection'
import { PageHero } from './PageHero'
import { RevealGroup } from '../ui/motion/RevealGroup'
import { RevealItem } from '../ui/motion/RevealItem'
import { TiltCard } from '../ui/motion/TiltCard'

const SCIENTIFIC_FRAME = [
  {
    title: 'Psychométrie & validité (usage prudent)',
    description:
      'Les outils servent de repères : on cherche des tendances, pas des étiquettes. Les résultats sont contextualisés en entretien.',
  },
  {
    title: 'Réduction des biais de désirabilité',
    description:
      'Certaines séquences privilégient la comparaison (choix forcés) et des formulations qui limitent les réponses « socialement attendues ».',
  },
  {
    title: 'Triangulation des signaux',
    description:
      'On croise valeurs, motivations, comportements et expériences concrètes pour éviter une décision basée sur un seul indicateur.',
  },
]

const RESTITUTION_PRINCIPLES = [
  {
    icon: <FileCheck size={20} />,
    title: 'Hypothèses explicites',
    description: 'Les synthèses séparent faits observés, interprétations et recommandations.',
  },
  {
    icon: <UserCheck size={20} />,
    title: 'Décision humaine',
    description: 'Le conseiller garde la main sur le sens, le rythme et la conclusion.',
  },
  {
    icon: <Lock size={20} />,
    title: 'Confidentialité',
    description:
      'Conception orientée RGPD et minimisation : utile au suivi, sans collecte superflue.',
  },
  {
    icon: <GitBranch size={20} />,
    title: 'Traçabilité',
    description:
      'Chaque étape produit des éléments réutilisables en restitution et en plan d’action.',
  },
]

const STEPS = [
  {
    label: 'Avant',
    title: 'Préparer les séances',
    description:
      'Cadre clair, progression par étapes, supports prêts à l’emploi : le conseiller entre en séance avec une structure, pas une page blanche.',
  },
  {
    label: 'Pendant',
    title: 'Conduire l’entretien',
    description:
      'Questions guidées, relances et consolidation des informations : l’outil aide à rester sur les objectifs sans rigidifier l’échange.',
  },
  {
    label: 'Après',
    title: 'Synthétiser et restituer',
    description:
      'Synthèses structurées et actionnables, avec un fil logique et des éléments directement réutilisables dans le plan d’action.',
  },
]

const ETHICS = [
  {
    title: 'Transparence',
    description:
      'Les résultats sont expliqués, discutés et contextualisés, sans « boîte noire » imposée.',
  },
  {
    title: 'Sûreté',
    description:
      'Gestion des données et droits d’accès alignés sur les usages cabinet (accès contrôlés, traçabilité).',
  },
  {
    title: 'Responsabilité',
    description:
      'Les recommandations restent des propositions : le conseiller arbitre avec la personne accompagnée.',
  },
]

export default function MethodologyPage() {
  return (
    <PublicLayout header={CABINET_HEADER}>
      <PageHero
        eyebrow="Méthodologie"
        title="Une méthode d’accompagnement scientifique, pilotée par l’humain."
        description="Transition Carrière structure le bilan autour d’outils issus des sciences comportementales et de l’entretien, avec une IA utilisée comme copilote de synthèse (pas comme juge). L’objectif : réduire les biais, augmenter la qualité, et rendre le travail du conseiller plus fluide et traçable."
        actions={
          <>
            <a href="#contact" className={buttonClassName({ variant: 'primary', size: 'lg' })}>
              Poser une question
            </a>
            <AppLink
              href="/offre"
              className={buttonClassName({
                variant: 'outline',
                size: 'lg',
                className: 'bg-surface/70',
              })}
            >
              Découvrir l’offre
            </AppLink>
          </>
        }
      />

      <MarketingSection tone="surface">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-8">
            <SectionHeading
              eyebrow="Cadre scientifique"
              title="Standardiser, trianguler, limiter les biais."
              description="La méthode combine questionnaires structurés, verbalisation guidée et synthèse actionnable. Le cadre vise la cohérence interne, la comparabilité, et une restitution utile à la décision."
            />
            <BulletList items={SCIENTIFIC_FRAME} />
          </div>

          <Card variant="flat" padding="lg" className="space-y-6">
            <div>
              <h3 className="text-title-lg">Principes de restitution</h3>
              <p className="mt-1 text-sm text-muted">Clarté, nuance, action.</p>
            </div>
            <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {RESTITUTION_PRINCIPLES.map((principle) => (
                <RevealItem key={principle.title}>
                  <Card padding="sm" className="h-full space-y-3">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-tint-sun text-ink"
                      aria-hidden="true"
                    >
                      {principle.icon}
                    </span>
                    <p className="font-semibold text-ink">{principle.title}</p>
                    <p className="text-sm text-muted">{principle.description}</p>
                  </Card>
                </RevealItem>
              ))}
            </RevealGroup>
          </Card>
        </div>
      </MarketingSection>

      <MarketingSection tone="canvas">
        <SectionHeading
          eyebrow="Pour le conseiller"
          title="Un accompagnement plus fluide, sans perdre la nuance."
          description="La plateforme n’automatise pas la relation. Elle standardise la mécanique (étapes, supports, restitutions) pour libérer du temps d’écoute et améliorer la qualité de sortie."
        />
        <RevealGroup
          className="relative mt-12 grid grid-cols-1 gap-6 md:grid-cols-3"
          stagger={0.15}
        >
          <span
            className="absolute top-10 right-[16%] left-[16%] hidden h-px bg-linear-to-r from-tint-apricot-bold via-tint-lavender-bold to-tint-lake-bold md:block"
            aria-hidden="true"
          />
          {STEPS.map((step, index) => (
            <RevealItem key={step.label} className="relative h-full">
              <TiltCard className="h-full">
                <Card padding="md" className="h-full space-y-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-on-ink"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <Eyebrow>{step.label}</Eyebrow>
                  <h3 className="text-title-md">{step.title}</h3>
                  <p className="text-sm text-muted">{step.description}</p>
                </Card>
              </TiltCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </MarketingSection>

      <MarketingSection tone="soft">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow="Éthique & limites"
            title="L’IA comme copilote, pas comme verdict."
            description="La valeur vient de l’alliance : outils structurés, expertise du conseiller et synthèse accélérée. Cette page n’est pas une promesse d’infaillibilité, mais un cadre de qualité et de transparence."
          />
          <BulletList items={ETHICS} />
        </div>
      </MarketingSection>

      <MarketingDemoSection
        id="contact"
        tone="surface"
        variant="contact"
        eyebrow="Une question ?"
        title="Intéressé par la méthodologie ?"
        description="Posez vos questions ou demandez une démo : nous revenons vers vous sous 48h ouvrées."
      />

      <CtaBand
        title="Prêt à structurer vos accompagnements ?"
        description="Transformez vos bilans en parcours rigoureux : clarté, nuance et livrables actionnables pour vos clients."
        actions={
          <>
            <a href="#contact" className={buttonClassName({ variant: 'secondary', size: 'lg' })}>
              Poser une question
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
}
