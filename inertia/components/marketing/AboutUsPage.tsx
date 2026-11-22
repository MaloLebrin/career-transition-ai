import { usePage } from '@inertiajs/react'
import React from 'react'
import PublicLayout from '../layout/PublicLayout'
import { Container } from '../ui/Container'
import { Eyebrow } from '../ui/Eyebrow'
import { SectionHeading } from '../ui/SectionHeading'
import { GaletPortrait } from './about/GaletPortrait'
import { TEAM, WHY_THE_NAME } from './about/team'
import { FinalCall } from './home/FinalCall'
import { StartAction } from './home/StartAction'
import { MarketingSection } from './MarketingSection'
import { brandPastel } from './tints'

/**
 * Page `/qui-sommes-nous` (brief jumpUjob, planche 50) : un héros court, les deux portraits
 * côte à côte (empilés sur mobile) découpés dans le galet, « Pourquoi ce nom », l'appel final.
 */
export default function AboutUsPage() {
  const { props } = usePage<{ b2cRegistrationEnabled?: boolean }>()
  const registrationOpen = Boolean(props.b2cRegistrationEnabled)

  return (
    <PublicLayout>
      <MarketingSection tone="soft" size="narrow">
        <SectionHeading
          level={1}
          size="display-lg"
          eyebrow="Qui sommes-nous"
          title="Deux psychologues du travail, un seul objectif : que vous sautiez au bon moment."
          description="jumpUjob est né d’un constat simple : les exercices d’un bilan de carrière sont précieux, mais ils sont enfermés dans des cabinets, des agendas et des devis. On les a mis en ligne, à votre rythme, avec un expert à portée de main quand vous en avez besoin."
        />
      </MarketingSection>

      <section className="bg-canvas">
        <Container className="grid grid-cols-1 gap-14 pt-16 pb-10 md:grid-cols-2 md:pt-20">
          {TEAM.map((member) => (
            <article key={member.name} className="flex flex-col gap-5">
              <GaletPortrait
                name={member.name}
                photoUrl={member.photoUrl}
                fallbackClassName={member.fallbackClassName}
                badgeClassName={member.badgeClassName}
              />
              <div className="flex flex-col gap-1.5">
                <h2 className="text-display-sm">{member.name}</h2>
                <p className="text-sm font-bold text-muted">{member.role}</p>
              </div>
              <p className="text-muted">{member.bio}</p>
              <ul className="flex flex-wrap gap-2" aria-label={`Domaines de ${member.name}`}>
                {member.tags.map((tag, index) => (
                  <li
                    key={tag}
                    className={`rounded-full px-3 py-1.5 text-caption font-bold text-ink ${brandPastel(index).surface}`}
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </Container>
      </section>

      <section className="bg-canvas">
        <Container size="narrow" className="flex flex-col gap-3 pt-6 pb-16 md:pb-20">
          <Eyebrow>Pourquoi ce nom</Eyebrow>
          <p className="text-body-lg text-muted">{WHY_THE_NAME}</p>
        </Container>
      </section>

      <FinalCall action={<StartAction registrationOpen={registrationOpen} />} />
    </PublicLayout>
  )
}
