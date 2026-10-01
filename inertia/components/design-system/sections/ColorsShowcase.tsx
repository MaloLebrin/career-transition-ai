import React from 'react'
import { ShowcaseSection } from './ShowcaseSection'

interface ColorToken {
  name: string
  usage: string
  onInk?: boolean
}

const GROUPS: { title: string; tokens: ColorToken[] }[] = [
  {
    title: 'Surfaces',
    tokens: [
      { name: 'canvas', usage: 'Fond de page' },
      { name: 'surface', usage: 'Cartes, champs' },
      { name: 'surface-soft', usage: 'Bandes alternées' },
      { name: 'hairline', usage: 'Bordures 1 px' },
      { name: 'hairline-strong', usage: 'Champs, outline' },
    ],
  },
  {
    title: 'Encre',
    tokens: [
      { name: 'ink', usage: 'Titres, surface sombre', onInk: true },
      { name: 'ink-soft', usage: 'Texte courant', onInk: true },
      { name: 'muted', usage: 'Texte secondaire', onInk: true },
      { name: 'muted-soft', usage: 'Placeholders', onInk: true },
    ],
  },
  {
    title: 'Action',
    tokens: [
      { name: 'primary', usage: 'Bouton principal, liens', onInk: true },
      { name: 'primary-pressed', usage: 'Survol', onInk: true },
      { name: 'primary-soft', usage: 'Fonds de badge' },
      { name: 'accent-warm', usage: 'CTA chaud, avertissements', onInk: true },
      { name: 'accent-warm-soft', usage: 'Fonds chauds' },
    ],
  },
  {
    title: 'Sémantique',
    tokens: [
      { name: 'success', usage: 'Terminé', onInk: true },
      { name: 'warning', usage: 'Attention', onInk: true },
      { name: 'danger', usage: 'Erreur', onInk: true },
      { name: 'info', usage: 'Information', onInk: true },
    ],
  },
  {
    title: 'Teintes pastel',
    tokens: [
      { name: 'tint-sage', usage: 'Catégorie' },
      { name: 'tint-teal', usage: 'Catégorie' },
      { name: 'tint-sand', usage: 'Catégorie' },
      { name: 'tint-terracotta', usage: 'Catégorie' },
      { name: 'tint-lavender', usage: 'Catégorie' },
      { name: 'tint-sky', usage: 'Catégorie' },
    ],
  },
]

/** Nuancier : chaque swatch lit sa couleur depuis la variable CSS du thème. */
export const ColorsShowcase: React.FC = () => (
  <ShowcaseSection
    eyebrow="01"
    title="Couleurs"
    description="Des rôles, pas des teintes : chaque token dit où il s'applique."
  >
    <div className="space-y-8">
      {GROUPS.map((group) => (
        <div key={group.title} className="space-y-3">
          <h3 className="text-title-sm">{group.title}</h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {group.tokens.map((token) => (
              <li
                key={token.name}
                className="overflow-hidden rounded-xl border border-hairline bg-surface"
              >
                <div
                  className="h-16"
                  style={{ background: `var(--color-${token.name})` }}
                  data-token={token.name}
                  aria-hidden="true"
                />
                <div className="space-y-0.5 p-3">
                  <p className="font-mono text-xs text-ink">{token.name}</p>
                  <p className="text-xs text-muted">{token.usage}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </ShowcaseSection>
)
