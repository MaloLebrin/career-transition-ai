import React from 'react'

export interface LegalSectionProps {
  title: string
  children: React.ReactNode
}

/** Section d'un document légal : titre `h2` + corps en texte courant. */
export const LegalSection: React.FC<LegalSectionProps> = ({ title, children }) => (
  <section>
    <h2 className="text-title-lg">{title}</h2>
    <div className="mt-4 space-y-3 text-base leading-relaxed text-ink-soft">{children}</div>
  </section>
)

/** Libellé clé mis en évidence dans le texte courant (« Dénomination », « Hébergeur »…). */
export const Term: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="font-semibold text-ink">{children}</span>
)

export interface PlaceholderProps {
  /** Texte du marqueur (défaut : `[à compléter]`). */
  children?: React.ReactNode
}

/** Marqueur discret d'une information à renseigner avant publication. */
export const Placeholder: React.FC<PlaceholderProps> = ({ children = '[à compléter]' }) => (
  <span className="italic text-muted">{children}</span>
)
