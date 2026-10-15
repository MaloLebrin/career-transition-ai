import React from 'react'
import { TEAM_CONTENT_IS_PLACEHOLDER, TEAM_MEMBERS } from '#shared/constants/team'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName } from '~/components/ui/Button'
import { SectionHeading } from '~/components/ui/SectionHeading'
import { PlaceholderNotice } from '../about/PlaceholderNotice'
import { TeamMonogram } from '../about/TeamMonogram'
import { MARKETING_TINT_CYCLE } from '../tints'

/** Bloc « L'équipe » de l'accueil : les psychologues en deux lignes, renvoi vers /qui-sommes-nous. */
export const TeamTeaser: React.FC = () => (
  <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
    <div className="space-y-6">
      <SectionHeading
        eyebrow="L’équipe"
        title="Deux psychologues du travail derrière les accompagnements."
        description="Les exercices sont conçus et les suivis assurés par des psychologues du travail. Vous pouvez demander leur accompagnement une fois le forfait réglé, sans engagement."
      />
      <AppLink
        href="/qui-sommes-nous"
        className={buttonClassName({ variant: 'outline', size: 'lg' })}
      >
        Faire connaissance avec l’équipe
      </AppLink>
    </div>
    <div className="space-y-4">
      <ul className="space-y-4">
        {TEAM_MEMBERS.map((member, index) => (
          <li key={member.id} className="flex items-center gap-4">
            <TeamMonogram
              firstName={member.firstName}
              lastName={member.lastName}
              tint={MARKETING_TINT_CYCLE[(index + 1) % MARKETING_TINT_CYCLE.length]}
              size="sm"
            />
            <div>
              <p className="font-semibold text-ink">
                {member.firstName} {member.lastName}
              </p>
              <p className="text-sm text-muted">{member.title}</p>
            </div>
          </li>
        ))}
      </ul>
      {TEAM_CONTENT_IS_PLACEHOLDER && <PlaceholderNotice />}
    </div>
  </div>
)
