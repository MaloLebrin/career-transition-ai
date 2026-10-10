import { usePage } from '@inertiajs/react'
import React from 'react'
import { B2C_PUBLIC_PATHS } from '#shared/constants/b2c'
import PublicLayout from '../layout/PublicLayout'
import AppLink from '../ui/AppLink'
import { buttonClassName } from '../ui/Button'
import { SectionHeading } from '../ui/SectionHeading'
import { CtaBand } from './CtaBand'
import { MarketingDemoSection } from './MarketingDemoSection'
import { FaqAccordion } from './FaqAccordion'
import { MarketingSection } from './MarketingSection'
import { PageHero } from './PageHero'
import { PlanComparison } from './individuals/PlanComparison'
import { TiltCard } from '../ui/motion/TiltCard'
import { FREE_TITLE, LINK_CLASS } from './individuals/copy'
import { ResultsPlanCard } from './individuals/ResultsPlanCard'

const FAQ = [
  {
    question: 'Que comprennent les exercices offerts ?',
    answer:
      'Motivations et Valeurs, avec leurs résultats et leur analyse. Ils restent acquis, que vous débloquiez la suite ou non.',
  },
  {
    question: 'Le forfait est-il un abonnement ?',
    answer: 'Non. Le forfait est réglé une seule fois, sans reconduction. Le prix affiché est TTC.',
  },
  {
    question: 'Comment se déroule le paiement ?',
    answer:
      'Par Stripe, sur une page de paiement sécurisée. Votre adresse e-mail doit être vérifiée avant de payer, et la facture vous est envoyée par e-mail.',
  },
  {
    question: 'Et l’accompagnement par un expert ?',
    answer:
      'Une fois le forfait réglé, vous pouvez demander à être accompagné par un expert. Les séances font l’objet d’un tarif et d’un contrat à part, sur demande.',
  },
  {
    question: 'Où trouver les conditions de vente ?',
    answer: 'Sur la page Conditions de vente, accessible depuis le pied de page de chaque page.',
  },
]

/** Tarif public `/tarifs` : le forfait particuliers (TTC). La grille cabinets est sur `/cabinets/tarifs`. */
export default function PricingPage() {
  const { props } = usePage<{ b2cRegistrationEnabled?: boolean }>()
  const registrationOpen = Boolean(props.b2cRegistrationEnabled)

  return (
    <PublicLayout>
      <PageHero
        eyebrow="Tarif"
        title="Un forfait unique, réglé une fois."
        description="Vous commencez gratuitement avec deux exercices. Si la suite vous parle, un paiement unique débloque l’ensemble du parcours, sans abonnement."
        actions={
          registrationOpen ? (
            <AppLink
              href={B2C_PUBLIC_PATHS.register}
              className={buttonClassName({ variant: 'primary', size: 'lg' })}
            >
              Commencer gratuitement
            </AppLink>
          ) : (
            <a href="#contact" className={buttonClassName({ variant: 'primary', size: 'lg' })}>
              Être prévenu de l’ouverture
            </a>
          )
        }
        aside={
          <TiltCard>
            <div className="rounded-2xl bg-hero-mesh p-1 shadow-floating animate-mesh-drift">
              <ResultsPlanCard />
            </div>
          </TiltCard>
        }
      >
        <p className="text-sm text-muted">
          Vous êtes un cabinet ?{' '}
          <AppLink href="/cabinets/tarifs" className={LINK_CLASS}>
            Voir les tarifs cabinets
          </AppLink>
        </p>
      </PageHero>

      <MarketingSection tone="surface">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <SectionHeading
              eyebrow="Gratuit ou forfait"
              title="Ce que débloque le forfait."
              description="Les exercices offerts restent acquis. Le forfait ouvre le reste du parcours et votre synthèse."
            />
          </div>
          <div className="lg:col-span-8">
            <PlanComparison />
          </div>
        </div>
      </MarketingSection>

      <MarketingSection tone="canvas" size="narrow">
        <SectionHeading title="Questions fréquentes" size="display-sm" />
        <div className="mt-8">
          <FaqAccordion items={FAQ} />
        </div>
      </MarketingSection>

      {!registrationOpen && (
        <MarketingDemoSection
          id="contact"
          tone="soft"
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
            <AppLink
              href={B2C_PUBLIC_PATHS.register}
              className={buttonClassName({ variant: 'secondary', size: 'lg' })}
            >
              Commencer gratuitement
            </AppLink>
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
