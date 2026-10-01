import React from 'react'
import PublicLayout from '~/components/layout/PublicLayout'
import { Eyebrow } from '~/components/ui/Eyebrow'
import { MarketingSection } from './MarketingSection'

export interface LegalDocumentProps {
  eyebrow: string
  title: string
  /** Chapeau sous le titre. */
  lead: string
  /** Date de dernière mise à jour, affichée telle quelle. */
  updatedAt?: string
  /** Contenu libre affiché avant les sections (ex. grille de cartes). */
  aside?: React.ReactNode
  children: React.ReactNode
}

/** Coquille des pages légales : en-tête de document puis sections, sur 768px. */
export const LegalDocument: React.FC<LegalDocumentProps> = ({
  eyebrow,
  title,
  lead,
  updatedAt,
  aside,
  children,
}) => (
  <PublicLayout>
    <MarketingSection tone="canvas" size="narrow">
      <article>
        <header className="space-y-4">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="text-display-md">{title}</h1>
          <p className="text-body-lg text-muted">{lead}</p>
          {updatedAt && (
            <p className="text-caption text-muted">Dernière mise à jour : {updatedAt}</p>
          )}
        </header>
        {aside && <div className="mt-10">{aside}</div>}
        <div className="mt-12 space-y-12">{children}</div>
      </article>
    </MarketingSection>
  </PublicLayout>
)
