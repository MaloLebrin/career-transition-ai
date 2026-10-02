import React from 'react'
import { ShowcaseSection } from './ShowcaseSection'

const SAMPLES: { className: string; label: string; sample: string }[] = [
  {
    className: 'text-display-xl font-display text-ink',
    label: 'display-xl · 64 px',
    sample: 'Structurez vos bilans.',
  },
  {
    className: 'text-display-lg font-display text-ink',
    label: 'display-lg · 48 px',
    sample: 'Une méthode structurée.',
  },
  {
    className: 'text-display-md font-display text-ink',
    label: 'display-md · 36 px',
    sample: 'Huit exercices prêts à l’emploi.',
  },
  {
    className: 'text-display-sm font-display text-ink',
    label: 'display-sm · 28 px',
    sample: 'Connexion',
  },
  {
    className: 'text-title-lg font-display text-ink',
    label: 'title-lg · 22 px',
    sample: 'Professionnel',
  },
  {
    className: 'text-title-md font-display text-ink',
    label: 'title-md · 18 px',
    sample: 'Un parcours par étapes',
  },
  {
    className: 'text-body-lg text-muted',
    label: 'body-lg · 18 px',
    sample: 'Le conseiller reste celui qui décide.',
  },
  {
    className: 'text-base text-ink-soft',
    label: 'base · 16 px',
    sample: 'Texte courant, interligne 1,5.',
  },
  {
    className: 'text-sm text-muted',
    label: 'sm · 14 px',
    sample: 'Texte de carte, formulaires, footer.',
  },
  {
    className: 'text-eyebrow text-accent',
    label: 'eyebrow · 14 px / 500',
    sample: 'Pour les cabinets',
  },
  {
    className: 'text-caption text-muted',
    label: 'caption · 13 px / 500',
    sample: 'Dernière mise à jour : octobre 2026',
  },
]

/** Échelle typographique : Manrope pour les titres, Inter pour l'interface. */
export const TypographyShowcase: React.FC = () => (
  <ShowcaseSection
    eyebrow="02"
    title="Typographie"
    description="Manrope 600 pour les titres, Inter pour tout le reste. Casse de phrase, jamais de majuscules espacées."
  >
    <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-surface">
      {SAMPLES.map((sample) => (
        <li
          key={sample.label}
          className="grid grid-cols-1 gap-2 p-5 md:grid-cols-12 md:items-baseline md:gap-6"
        >
          <span className="font-mono text-xs text-muted md:col-span-3">{sample.label}</span>
          <span className={`${sample.className} md:col-span-9`}>{sample.sample}</span>
        </li>
      ))}
    </ul>
  </ShowcaseSection>
)
