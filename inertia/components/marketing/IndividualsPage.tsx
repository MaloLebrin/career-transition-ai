import { usePage } from '@inertiajs/react'
import { Gift, Sparkles, UserRound } from 'lucide-react'
import React from 'react'
import { B2C_FREE_EXERCISE_TYPES, B2C_PUBLIC_PATHS } from '#shared/constants/b2c'
import { BILLING_CURRENCY, DEFAULT_RESULTS_PRICE_CENTS } from '#shared/constants/billing'
import { EXERCISE_LIST } from '#shared/constants/exercises'
import { formatPrice } from '#shared/helpers/billing/format_price'
import { useBilling } from '~/hooks/use_billing'
import PublicLayout from '../layout/PublicLayout'
import AppLink from '../ui/AppLink'
import Badge from '../ui/Badge'
import { buttonClassName } from '../ui/Button'
import Card from '../ui/Card'
import { SectionHeading } from '../ui/SectionHeading'
import { BulletList } from './BulletList'
import { CtaBand } from './CtaBand'
import { FeatureCard } from './FeatureCard'
import { MarketingDemoSection } from './MarketingDemoSection'
import { MarketingSection } from './MarketingSection'

const NUMBER_WORDS = [
  'zéro',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
]

/** Compteur en lettres, dérivé des constantes partagées (jamais écrit en dur). */
function countWord(count: number): string {
  return NUMBER_WORDS[count] ?? String(count)
}

const TOTAL_WORD = countWord(EXERCISE_LIST.length)
const FREE_WORD = countWord(B2C_FREE_EXERCISE_TYPES.length)
const FREE_TITLE = `${FREE_WORD.charAt(0).toUpperCase()}${FREE_WORD.slice(1)} exercices offerts`

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

const INCLUDED = [
  `Les ${TOTAL_WORD} exercices du parcours et leurs résultats détaillés`,
  'Les analyses IA de chaque exercice',
  'Votre synthèse de parcours et son export PDF',
  'La possibilité de demander un accompagnement par un expert',
]

const EXCLUDED = [
  'Les séances avec un expert (tarif et contrat à part, sur demande)',
  'Un abonnement : le forfait est réglé une fois, sans reconduction',
]

const LINK_CLASS = 'text-sm font-medium text-accent hover:underline'

/** Prix du forfait : prop partagée `billing` si présente, sinon le défaut de l'application. */
export function useResultsPriceLabel(): string {
  const billing = useBilling()
  return formatPrice(
    billing?.resultsPriceCents ?? DEFAULT_RESULTS_PRICE_CENTS,
    billing?.currency ?? BILLING_CURRENCY
  )
}

/**
 * Page `/particuliers` (épic B2C #99) : la promesse, les deux exercices offerts,
 * le forfait et l'accompagnement. Le CTA renvoie vers l'inscription quand
 * elle est ouverte (`b2cRegistrationEnabled`), vers le formulaire de contact sinon.
 */
export default function IndividualsPage() {
  const { props } = usePage<{ b2cRegistrationEnabled?: boolean }>()
  const registrationOpen = Boolean(props.b2cRegistrationEnabled)
  const priceLabel = useResultsPriceLabel()
  const freeExercises = EXERCISE_LIST.filter((entry) =>
    (B2C_FREE_EXERCISE_TYPES as readonly string[]).includes(entry.slug)
  )

  const primaryCta = registrationOpen ? (
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

  return (
    <PublicLayout>
      <MarketingSection tone="canvas">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="space-y-8 lg:col-span-7">
            <SectionHeading
              level={1}
              size="display-lg"
              eyebrow="Pour les particuliers"
              title="Faites le point sur votre carrière, à votre rythme."
              description="Le même parcours que celui des cabinets de transition professionnelle, en autonomie : des exercices issus des sciences comportementales, une analyse assistée par l’IA, et un expert si vous en ressentez le besoin."
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              {primaryCta}
              <AppLink
                href={B2C_PUBLIC_PATHS.pricing}
                className={buttonClassName({ variant: 'outline', size: 'lg' })}
              >
                Voir le tarif
              </AppLink>
            </div>
            <p className="text-sm text-muted">
              Vous êtes un cabinet ?{' '}
              <AppLink href="/offre" className={LINK_CLASS}>
                Découvrir l’offre pour les cabinets
              </AppLink>
            </p>
          </div>

          <Card padding="md" className="lg:col-span-5">
            <p className="text-eyebrow text-accent">Pour commencer, gratuitement</p>
            <ul className="mt-4 space-y-4">
              {freeExercises.map((exercise) => (
                <li key={exercise.slug} className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-title-sm text-ink">{exercise.title}</p>
                    <Badge variant="sun">Gratuit</Badge>
                  </div>
                  <p className="text-sm text-muted">{exercise.description}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </MarketingSection>

      <MarketingSection tone="surface">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection tone="canvas">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-8">
            <SectionHeading
              eyebrow="Comment ça marche"
              title="Trois étapes, aucune pression."
              description="Vous avancez quand vous voulez. Les exercices offerts restent acquis, que vous débloquiez la suite ou non."
            />
            <BulletList items={STEPS} />
          </div>

          <Card variant="dark" padding="lg" className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-title-lg text-on-ink">Le forfait</h3>
                <p className="text-sm text-on-ink-soft">Paiement unique, sans abonnement</p>
              </div>
              <Badge variant="sun">TTC</Badge>
            </div>
            <p className="font-display text-display-sm text-on-ink">{priceLabel}</p>
            <div className="space-y-2">
              <p className="text-eyebrow text-accent-on-ink">Inclus</p>
              <ul className="space-y-2 text-sm text-on-ink">
                {INCLUDED.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-eyebrow text-on-ink-muted">Non inclus</p>
              <ul className="space-y-2 text-sm text-on-ink-soft">
                {EXCLUDED.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
            <div className="mt-auto flex flex-wrap gap-x-6 gap-y-2 border-t border-on-ink/15 pt-6">
              <AppLink
                href={B2C_PUBLIC_PATHS.terms}
                className="text-sm font-medium text-accent-on-ink hover:underline"
              >
                Conditions de vente
              </AppLink>
              <AppLink
                href={B2C_PUBLIC_PATHS.privacy}
                className="text-sm font-medium text-accent-on-ink hover:underline"
              >
                Politique de confidentialité
              </AppLink>
            </div>
          </Card>
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
