import { usePage } from '@inertiajs/react'
import { Brain, Lock, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react'
import React from 'react'
import { LandscapeArt } from '~/components/marketing/LandscapeArt'
import { MarketingSection } from '~/components/marketing/MarketingSection'
import { ProductMockup } from '~/components/marketing/ProductMockup'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName } from '~/components/ui/Button'
import { SectionHeading } from '~/components/ui/SectionHeading'
import { INDIVIDUALS_ACTION, LOGIN_ACTION } from '~/config/marketing'

const PROOF_POINTS: Array<{ icon: LucideIcon; label: string }> = [
  { icon: Brain, label: 'Huit exercices issus des sciences comportementales' },
  { icon: Lock, label: 'Données pseudonymisées avant tout traitement par l’IA' },
  { icon: ShieldCheck, label: 'Hébergement et traitements dans l’Union européenne' },
]

interface FloatingChipProps {
  icon: LucideIcon
  label: string
  className: string
  /** Décalage de phase du flottement (secondes, négatif). */
  delay: number
}

/** Puce flottante autour de l'aperçu produit : desktop seulement, décorative. */
const FloatingChip: React.FC<FloatingChipProps> = ({ icon: Icon, label, className, delay }) => (
  <span
    className={`pointer-events-none absolute hidden animate-float items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium shadow-raised lg:inline-flex ${className}`}
    style={{ animationDelay: `${delay}s` }}
    aria-hidden="true"
  >
    <Icon className="h-4 w-4" />
    {label}
  </span>
)

/** Entrée en cascade du contenu du hero (`animate-slide-up`, retard par bloc). */
const enter = (delayMs: number): React.CSSProperties => ({ animationDelay: `${delayMs}ms` })

/**
 * Hero de la page d'accueil : un paysage apaisant en pleine largeur, puis la promesse, deux
 * actions, les points de preuve et l'aperçu du produit.
 */
export const HeroSection: React.FC = () => {
  const { props } = usePage<{ registrationEnabled?: boolean }>()

  return (
    <>
      <div
        className="h-52 w-full overflow-hidden border-b border-hairline sm:h-64 lg:h-80 xl:h-96"
        data-testid="hero-landscape"
      >
        <LandscapeArt variant="hero" />
      </div>
      <MarketingSection tone="canvas" className="pt-12 md:pt-16">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="space-y-8 lg:col-span-7">
            <div className="animate-slide-up">
              <SectionHeading
                level={1}
                size="display-xl"
                eyebrow="Pour les cabinets de transition professionnelle"
                title="Structurez vos bilans de compétences, sans perdre la nuance."
                description="Transition Carrière donne à vos conseillers un parcours d’exercices prêts à l’emploi, une synthèse assistée par l’IA et des livrables clairs. Le conseiller reste celui qui décide."
              />
            </div>
            <div className="flex animate-slide-up flex-col gap-3 sm:flex-row" style={enter(120)}>
              <a href="#demo" className={buttonClassName({ variant: 'primary', size: 'lg' })}>
                Demander une démo
              </a>
              <AppLink
                href="/methodologie"
                className={buttonClassName({ variant: 'outline', size: 'lg' })}
              >
                Voir la méthodologie
              </AppLink>
            </div>
            <p
              className="flex animate-slide-up flex-wrap gap-x-4 gap-y-1 text-sm text-muted"
              style={enter(200)}
            >
              <span>
                Déjà client ?{' '}
                <AppLink
                  href={LOGIN_ACTION.href}
                  className="font-medium text-accent hover:underline"
                >
                  {LOGIN_ACTION.label}
                </AppLink>
              </span>
              {props.registrationEnabled && (
                <AppLink href="/auth/register" className="font-medium text-accent hover:underline">
                  Créer un compte cabinet
                </AppLink>
              )}
            </p>
            {/* Les particuliers ont l'accueil du site, sans brouiller le message cabinet. */}
            <p className="animate-slide-up text-sm text-muted" style={enter(260)}>
              <AppLink
                href={INDIVIDUALS_ACTION.href}
                className="font-medium text-accent hover:underline"
              >
                {INDIVIDUALS_ACTION.label}
              </AppLink>{' '}
              Découvrez le parcours en autonomie, avec deux exercices offerts.
            </p>
            <ul className="flex flex-col gap-2 border-t border-hairline pt-6 text-sm text-muted sm:flex-row sm:flex-wrap sm:gap-x-6">
              {PROOF_POINTS.map(({ icon: Icon, label }, index) => (
                <li
                  key={label}
                  className="flex animate-slide-up items-center gap-2"
                  style={enter(340 + index * 90)}
                >
                  <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative animate-slide-up lg:col-span-5" style={enter(200)}>
            <div className="animate-float [animation-duration:9s]">
              <ProductMockup />
            </div>
            <FloatingChip
              icon={Sparkles}
              label="Synthèse prête à relire"
              className="-left-4 top-10 bg-tint-lavender text-tint-lavender-ink"
              delay={0}
            />
            <FloatingChip
              icon={ShieldCheck}
              label="Données pseudonymisées"
              className="-right-3 bottom-8 bg-tint-meadow text-tint-meadow-ink"
              delay={-3}
            />
          </div>
        </div>
      </MarketingSection>
    </>
  )
}
