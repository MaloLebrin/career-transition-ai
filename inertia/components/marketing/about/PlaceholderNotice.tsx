import { Info } from 'lucide-react'
import React from 'react'
import { TEAM_PLACEHOLDER_NOTICE } from '#shared/constants/team'

export interface PlaceholderNoticeProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Note de transparence sous un contenu d'illustration (DESIGN.md §1, contenu honnête).
 * La condition d'affichage (`TEAM_CONTENT_IS_PLACEHOLDER`) reste dans la page.
 */
export const PlaceholderNotice: React.FC<PlaceholderNoticeProps> = ({
  children = TEAM_PLACEHOLDER_NOTICE,
  className = '',
}) => (
  <p role="note" className={`flex items-start gap-2 text-sm text-muted ${className}`.trim()}>
    <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
    <span>{children}</span>
  </p>
)
