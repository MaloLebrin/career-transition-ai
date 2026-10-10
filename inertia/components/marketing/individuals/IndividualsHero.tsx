import { Check, Sparkles } from 'lucide-react'
import React from 'react'
import { B2C_PUBLIC_PATHS } from '#shared/constants/b2c'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName } from '~/components/ui/Button'
import { Container } from '~/components/ui/Container'
import { Parallax } from '~/components/ui/motion/Parallax'
import { SectionHeading } from '~/components/ui/SectionHeading'
import { LOGIN_ACTION } from '~/config/marketing'
import { HeroBackdrop } from '../HeroBackdrop'
import { JourneyMockup } from '../mockups/JourneyMockup'
import { FREE_EXERCISES, LINK_CLASS } from './copy'

interface IndividualsHeroProps {
  /** Inscription des particuliers ouverte (`b2cRegistrationEnabled`). */
  registrationOpen: boolean
}

const enter = (delayMs: number): React.CSSProperties => ({ animationDelay: `${delayMs}ms` })

/**
 * Héros de l'accueil : maillage animé sous l'en-tête transparent, promesse, CTA
 * d'inscription (ou d'attente quand elle est fermée) et le parcours qui se complète
 * dans un mockup incliné.
 */
export const IndividualsHero: React.FC<IndividualsHeroProps> = ({ registrationOpen }) => (
  <section className="relative isolate -mt-16 overflow-hidden pt-16">
    <HeroBackdrop />
    <Container className="grid grid-cols-1 items-center gap-14 pt-12 pb-20 md:pt-20 md:pb-28 lg:grid-cols-12 lg:gap-10">
      <div className="space-y-8 lg:col-span-6">
        <div className="animate-slide-up">
          <SectionHeading
            level={1}
            size="display-xl"
            eyebrow="Bilan de carrière en autonomie"
            title="Faites le point sur votre carrière, à votre rythme."
            description="Le même parcours que celui des cabinets de transition professionnelle, en autonomie : des exercices issus des sciences comportementales, une analyse assistée par l’IA, et un expert si vous en ressentez le besoin."
          />
        </div>
        <div className="flex animate-slide-up flex-col gap-3 sm:flex-row" style={enter(120)}>
          {registrationOpen ? (
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
          )}
          <AppLink
            href={B2C_PUBLIC_PATHS.pricing}
            className={buttonClassName({
              variant: 'outline',
              size: 'lg',
              className: 'bg-surface/70',
            })}
          >
            Voir le tarif
          </AppLink>
        </div>
        <ul
          className="flex animate-slide-up flex-col gap-2 text-sm text-ink-soft"
          style={enter(240)}
        >
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-success" aria-hidden="true" />
            {FREE_EXERCISES.map((exercise) => exercise.title).join(' et ')} offerts, sans carte
            bancaire
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-success" aria-hidden="true" />
            Vos données pseudonymisées avant toute analyse par l’IA
          </li>
        </ul>
        <p className="text-sm text-muted">
          Déjà inscrit ?{' '}
          <AppLink href={LOGIN_ACTION.href} className={LINK_CLASS}>
            {LOGIN_ACTION.label}
          </AppLink>
        </p>
      </div>

      <div className="relative animate-slide-up perspective-hero lg:col-span-6" style={enter(300)}>
        <Parallax offset={24}>
          <div className="relative mx-auto max-w-md transform-3d lg:-rotate-y-12 lg:rotate-x-6">
            <JourneyMockup />
            <span
              className="absolute -bottom-5 -left-8 hidden animate-float items-center gap-2 rounded-xl border border-hairline bg-surface px-4 py-3 text-sm font-medium text-ink shadow-floating lg:inline-flex"
              aria-hidden="true"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-tint-blossom text-tint-blossom-ink">
                <Sparkles className="h-4 w-4" />
              </span>
              Analyse IA prête
            </span>
          </div>
        </Parallax>
      </div>
    </Container>
  </section>
)
