import { ArrowDown } from 'lucide-react'
import React from 'react'
import { TEAM_CONTENT_IS_PLACEHOLDER, TEAM_MEMBERS } from '#shared/constants/team'
import Card from '~/components/ui/Card'
import { MARKETING_TINT_CYCLE } from '../tints'
import { TeamMonogram } from './TeamMonogram'

/** Carte du héros de /qui-sommes-nous : les psychologues de l'équipe, renvoi vers `#equipe`. */
export const TeamHeroCard: React.FC = () => (
  <Card padding="md" className="shadow-floating" data-testid="about-team-card">
    <p className="text-eyebrow text-accent">L’équipe</p>
    <p className="mt-1 text-title-md text-ink">Deux psychologues du travail</p>
    <ul className="mt-6 divide-y divide-hairline">
      {TEAM_MEMBERS.map((member, index) => (
        <li key={member.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
          <TeamMonogram
            firstName={member.firstName}
            lastName={member.lastName}
            tint={MARKETING_TINT_CYCLE[(index + 1) % MARKETING_TINT_CYCLE.length]}
            size="sm"
          />
          <div className="min-w-0">
            <p className="font-semibold text-ink">
              {member.firstName} {member.lastName}
            </p>
            <p className="truncate text-sm text-muted">{member.title}</p>
          </div>
        </li>
      ))}
    </ul>
    <p className="mt-6 border-t border-hairline pt-4 text-sm text-muted">
      {TEAM_CONTENT_IS_PLACEHOLDER
        ? 'Profils d’illustration, en cours de rédaction.'
        : 'Titre protégé, cadre déontologique de la profession.'}
    </p>
    <a
      href="#equipe"
      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent underline-offset-4 hover:underline"
    >
      Découvrir l’équipe
      <ArrowDown size={16} aria-hidden="true" />
    </a>
  </Card>
)
