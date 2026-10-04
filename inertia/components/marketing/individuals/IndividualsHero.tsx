import React from 'react'
import { B2C_PUBLIC_PATHS } from '#shared/constants/b2c'
import AppLink from '~/components/ui/AppLink'
import Badge from '~/components/ui/Badge'
import { buttonClassName } from '~/components/ui/Button'
import Card from '~/components/ui/Card'
import { SectionHeading } from '~/components/ui/SectionHeading'
import { LOGIN_ACTION } from '~/config/marketing'
import { LandscapeArt } from '../LandscapeArt'
import { MarketingSection } from '../MarketingSection'
import { FREE_EXERCISES, LINK_CLASS } from './copy'

interface IndividualsHeroProps {
  /** Inscription des particuliers ouverte (`b2cRegistrationEnabled`). */
  registrationOpen: boolean
}

/**
 * Hero de l'accueil : paysage en panorama, promesse, CTA d'inscription (ou d'attente
 * quand elle est fermée), connexion et carte des exercices offerts.
 */
export const IndividualsHero: React.FC<IndividualsHeroProps> = ({ registrationOpen }) => (
  <MarketingSection tone="canvas" className="pt-8 md:pt-12">
    <div
      className="mb-12 aspect-[16/9] overflow-hidden rounded-2xl border border-hairline shadow-card md:aspect-[3/1] lg:mb-16"
      data-testid="hero-landscape"
    >
      <LandscapeArt variant="hero" />
    </div>
    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="space-y-8 lg:col-span-7">
        <SectionHeading
          level={1}
          size="display-xl"
          eyebrow="Bilan de carrière en autonomie"
          title="Faites le point sur votre carrière, à votre rythme."
          description="Le même parcours que celui des cabinets de transition professionnelle, en autonomie : des exercices issus des sciences comportementales, une analyse assistée par l’IA, et un expert si vous en ressentez le besoin."
        />
        <div className="flex flex-col gap-3 sm:flex-row">
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
            className={buttonClassName({ variant: 'outline', size: 'lg' })}
          >
            Voir le tarif
          </AppLink>
        </div>
        <p className="text-sm text-muted">
          Déjà inscrit ?{' '}
          <AppLink href={LOGIN_ACTION.href} className={LINK_CLASS}>
            {LOGIN_ACTION.label}
          </AppLink>
        </p>
      </div>

      <Card padding="md" className="lg:col-span-5">
        <p className="text-eyebrow text-accent">Pour commencer, gratuitement</p>
        <ul className="mt-4 space-y-4">
          {FREE_EXERCISES.map((exercise) => (
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
)
