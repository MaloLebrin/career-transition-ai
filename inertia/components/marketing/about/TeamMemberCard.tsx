import React from 'react'
import type { TeamMember } from '#shared/constants/team'
import Badge from '~/components/ui/Badge'
import Card from '~/components/ui/Card'
import type { MarketingTint } from '../tints'
import { TeamMonogram } from './TeamMonogram'

export interface TeamMemberCardProps {
  member: TeamMember
  /** Teinte du monogramme et des spécialités. */
  tint?: MarketingTint
  className?: string
}

/** Fiche d'un membre de l'équipe : monogramme, nom, fonction, parcours et spécialités. */
export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  tint = 'lake',
  className = '',
}) => {
  const fullName = `${member.firstName} ${member.lastName}`
  return (
    <Card padding="md" className={`flex h-full flex-col gap-5 ${className}`.trim()}>
      <div className="flex items-center gap-4">
        <TeamMonogram firstName={member.firstName} lastName={member.lastName} tint={tint} />
        <div className="space-y-1">
          <h3 className="text-title-md">{fullName}</h3>
          <p className="text-sm font-medium text-ink">{member.title}</p>
        </div>
      </div>
      <p className="text-sm text-muted">{member.credentials}</p>
      <p className="text-sm leading-relaxed text-ink-soft">{member.bio}</p>
      <ul
        aria-label={`Spécialités de ${member.firstName}`}
        className="mt-auto flex flex-wrap gap-2"
      >
        {member.specialties.map((specialty) => (
          <li key={specialty}>
            <Badge variant={tint}>{specialty}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  )
}
