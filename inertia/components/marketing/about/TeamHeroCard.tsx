import { ArrowDown } from 'lucide-react'
import React from 'react'
import { TEAM_CONTENT_IS_PLACEHOLDER, TEAM_MEMBERS } from '#shared/constants/team'
import { Companion } from '~/components/ui/Companion'
import { Eyebrow } from '~/components/ui/Eyebrow'
import { MARKETING_TINT_CYCLE, MARKETING_TINTS } from '../tints'
import { TeamMonogram } from './TeamMonogram'

/**
 * Visuel du héros de /qui-sommes-nous : les psychologues de l'équipe en deux tuiles teintées
 * (monogramme, nom, fonction, spécialités), cadre en maillage comme le héros de /tarifs,
 * compagnon décoratif. Renvoi vers `#equipe`.
 */
export const TeamHeroCard: React.FC = () => (
  <div className="relative" data-testid="about-team-card">
    <div className="rounded-2xl bg-hero-mesh p-1 shadow-floating animate-mesh-drift">
      <div className="rounded-xl bg-surface p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Eyebrow>L’équipe</Eyebrow>
            <p className="mt-1 text-title-md text-ink">Deux psychologues du travail</p>
          </div>
          <a
            href="#equipe"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Découvrir l’équipe
            <ArrowDown size={16} aria-hidden="true" />
          </a>
        </div>

        <ul className="mt-5 grid grid-cols-2 gap-3">
          {TEAM_MEMBERS.map((member, index) => {
            const tint = MARKETING_TINT_CYCLE[(index + 1) % MARKETING_TINT_CYCLE.length]
            return (
              <li
                key={member.id}
                className={`flex flex-col items-center rounded-xl px-3 py-5 text-center ${MARKETING_TINTS[tint].surface}`}
              >
                <TeamMonogram
                  firstName={member.firstName}
                  lastName={member.lastName}
                  tint={tint}
                  size="xl"
                  inverted
                />
                <p className="mt-3 font-display text-title-sm text-ink">
                  {member.firstName} {member.lastName}
                </p>
                <p className={`text-caption ${MARKETING_TINTS[tint].ink}`}>{member.title}</p>
                <p className="mt-3 text-caption leading-relaxed text-ink-soft">
                  {member.specialties.slice(0, 2).join(' · ')}
                </p>
              </li>
            )
          })}
        </ul>

        <p className="mt-4 text-caption text-muted">
          {TEAM_CONTENT_IS_PLACEHOLDER
            ? 'Profils d’illustration, en cours de rédaction.'
            : 'Titre protégé, cadre déontologique de la profession.'}
        </p>
      </div>
    </div>
    <Companion
      pose="wave"
      size="sm"
      animated
      className="absolute -right-3 -bottom-5 h-20 w-20 lg:-right-5 lg:-bottom-7 lg:h-24 lg:w-24"
    />
  </div>
)
