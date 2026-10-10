import React from 'react'
import { Container } from '~/components/ui/Container'
import { Parallax } from '~/components/ui/motion/Parallax'
import { SectionHeading } from '~/components/ui/SectionHeading'
import { HeroBackdrop } from './HeroBackdrop'

export interface PageHeroProps {
  eyebrow: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  /** Boutons ou liens-boutons sous le texte. */
  actions?: React.ReactNode
  /** Visuel à droite (mockup, carte) ; sans lui le héros est centré. */
  aside?: React.ReactNode
  /** Contenu sous les actions (points de preuve, lien secondaire). */
  children?: React.ReactNode
}

const enter = (delayMs: number): React.CSSProperties => ({ animationDelay: `${delayMs}ms` })

/**
 * Héros des pages marketing secondaires (offre, méthodologie, tarifs, qui sommes-nous) :
 * maillage atténué sous l'en-tête transparent, titre `display-lg`, actions, visuel optionnel.
 */
export const PageHero: React.FC<PageHeroProps> = ({
  eyebrow,
  title,
  description,
  actions,
  aside,
  children,
}) => {
  const centered = !aside
  return (
    <section className="relative isolate -mt-16 overflow-hidden pt-16">
      <HeroBackdrop intensity="soft" />
      <Container
        className={`grid grid-cols-1 items-center gap-12 pt-12 pb-16 md:pt-20 md:pb-24 ${
          centered ? '' : 'lg:grid-cols-12 lg:gap-14'
        }`}
      >
        <div
          className={`space-y-8 ${centered ? 'mx-auto max-w-3xl text-center' : 'lg:col-span-7'}`}
        >
          <div className="animate-slide-up">
            <SectionHeading
              level={1}
              size="display-lg"
              align={centered ? 'center' : 'left'}
              eyebrow={eyebrow}
              title={title}
              description={description}
            />
          </div>
          {actions && (
            <div
              className={`flex animate-slide-up flex-col gap-3 sm:flex-row ${centered ? 'justify-center' : ''}`}
              style={enter(120)}
            >
              {actions}
            </div>
          )}
          {children && (
            <div className="animate-slide-up" style={enter(220)}>
              {children}
            </div>
          )}
        </div>
        {aside && (
          <div className="animate-slide-up lg:col-span-5" style={enter(200)}>
            <Parallax offset={20}>{aside}</Parallax>
          </div>
        )}
      </Container>
    </section>
  )
}
