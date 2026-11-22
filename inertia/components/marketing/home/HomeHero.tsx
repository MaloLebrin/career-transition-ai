import React from 'react'
import { B2C_PUBLIC_PATHS } from '#shared/constants/b2c'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName } from '~/components/ui/Button'
import { Container } from '~/components/ui/Container'
import { SectionHeading } from '~/components/ui/SectionHeading'
import { JourneyMockup } from '../mockups/JourneyMockup'
import { FREE_TITLE, TOTAL_WORD } from '../individuals/copy'
import { StartAction } from './StartAction'

interface HomeHeroProps {
  registrationOpen: boolean
}

export const HOME_TAGLINE = 'Le saut, oui. Le vide, non.'

/**
 * Héros de l'accueil (planche 47) : l'accroche jumpUjob, une phrase, deux boutons, la
 * mention des exercices offerts, et l'unique mockup « Mon parcours » à droite.
 * Une colonne sous `lg` : le texte, puis le mockup.
 */
export const HomeHero: React.FC<HomeHeroProps> = ({ registrationOpen }) => (
  <section className="bg-surface-soft">
    <Container className="grid grid-cols-1 items-center gap-12 py-16 md:py-20 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
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
        <div className="flex flex-col gap-3 sm:flex-row">
          <StartAction registrationOpen={registrationOpen} onHome />
          <AppLink
            href={B2C_PUBLIC_PATHS.pricing}
            className={buttonClassName({ variant: 'secondary', size: 'lg' })}
          >
            Voir le tarif
          </AppLink>
        </div>
        <p className="text-sm text-muted">{FREE_TITLE}, sans carte bancaire.</p>
      </div>
      <div className="mx-auto w-full max-w-md">
        <JourneyMockup />
      </div>
    </Container>
  </section>
)
