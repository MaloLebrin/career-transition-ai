import React from 'react'
import { B2C_PUBLIC_PATHS } from '#shared/constants/b2c'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName } from '~/components/ui/Button'
import { Companion } from '~/components/ui/Companion'
import { Container } from '~/components/ui/Container'
import { Parallax } from '~/components/ui/motion/Parallax'
import { SectionHeading } from '~/components/ui/SectionHeading'
import { HeroBackdrop } from '../HeroBackdrop'
import { JourneyMockup } from '../mockups/JourneyMockup'
import { FREE_TITLE, TOTAL_WORD } from '../individuals/copy'
import { StartAction } from './StartAction'

interface HomeHeroProps {
  registrationOpen: boolean
}

export const HOME_TAGLINE = 'Le saut, oui. Le vide, non.'

const enter = (delayMs: number): React.CSSProperties => ({ animationDelay: `${delayMs}ms` })

/**
 * Héros de l'accueil : le paysage du design system en pleine largeur sous l'en-tête
 * transparent, l'accroche jumpUjob, une phrase, deux boutons, la mention des exercices
 * offerts, l'unique mockup « Mon parcours » incliné et le compagnon qui salue, posé sur la
 * prairie. Une colonne sous `lg` : le texte, puis le mockup.
 */
export const HomeHero: React.FC<HomeHeroProps> = ({ registrationOpen }) => (
  <section className="relative isolate -mt-16 overflow-hidden pt-16">
    <HeroBackdrop scene="landscape" />
    <Container className="grid grid-cols-1 items-center gap-14 pt-12 pb-20 md:pt-20 md:pb-28 lg:grid-cols-12 lg:gap-10">
      <div className="flex flex-col gap-6 lg:col-span-6">
        <div className="animate-slide-up">
          <SectionHeading
            level={1}
            size="display-xl"
            title={
              <>
                Le saut, oui.
                <br />
                Le vide, non.
              </>
            }
            description={`Faites le point sur votre carrière à votre rythme : ${TOTAL_WORD} exercices issus des sciences comportementales, une analyse assistée par l’IA, et un expert si vous en ressentez le besoin.`}
          />
        </div>
        <div className="flex animate-slide-up flex-col gap-3 sm:flex-row" style={enter(120)}>
          <StartAction registrationOpen={registrationOpen} onHome />
          <AppLink
            href={B2C_PUBLIC_PATHS.pricing}
            className={buttonClassName({ variant: 'secondary', size: 'lg' })}
          >
            Voir le tarif
          </AppLink>
        </div>
        <p className="animate-slide-up text-sm text-muted" style={enter(240)}>
          {FREE_TITLE}, sans carte bancaire.
        </p>
      </div>

      <div className="relative animate-slide-up perspective-hero lg:col-span-6" style={enter(300)}>
        <Parallax offset={24}>
          <div className="relative mx-auto max-w-md transform-3d lg:-rotate-y-12 lg:rotate-x-6">
            <JourneyMockup />
          </div>
        </Parallax>
        <Companion
          pose="wave"
          size="md"
          animated
          className="absolute -right-1 -bottom-8 lg:-right-2 lg:-bottom-12 lg:h-40 lg:w-40"
        />
      </div>
    </Container>
  </section>
)
