import React from 'react'
import { ShowcaseSection } from './ShowcaseSection'

const TINTS = ['sun', 'apricot', 'meadow', 'lake', 'lavender', 'blossom', 'sky'] as const

interface ColorToken {
  name: string
  usage: string
  onInk?: boolean
}

const GROUPS: { title: string; tokens: ColorToken[] }[] = [
  {
    title: 'Surfaces',
    tokens: [
      { name: 'canvas', usage: 'Fond de page, ivoire' },
      { name: 'surface', usage: 'Cartes, champs' },
      { name: 'surface-soft', usage: 'Bandes alternées' },
      { name: 'surface-strong', usage: 'Fonds désactivés' },
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
      { name: 'on-ink-soft', usage: 'Texte sur ink' },
    ],
  },
  {
    title: 'Action',
    tokens: [
      { name: 'primary', usage: 'Bouton principal (encre)', onInk: true },
      { name: 'primary-pressed', usage: 'Survol', onInk: true },
      { name: 'primary-soft', usage: 'Lignes sélectionnées' },
      { name: 'accent', usage: 'Liens, focus, sur-titres', onInk: true },
      { name: 'accent-pressed', usage: 'Survol des liens', onInk: true },
      { name: 'accent-soft', usage: 'État actif, tuiles' },
      { name: 'accent-on-ink', usage: 'Teal sur ink' },
      { name: 'sun', usage: 'Bouton secondaire, texte encre' },
      { name: 'sun-pressed', usage: 'Survol' },
      { name: 'sun-soft', usage: 'Tuiles, carte sun' },
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
    title: 'Teintes expressives (fond + texte -ink)',
    tokens: TINTS.map((tint) => ({ name: `tint-${tint}`, usage: 'Catégorie, badge' })),
  },
  {
    title: 'Teintes vives (décor, jamais de texte)',
    tokens: TINTS.map((tint) => ({ name: `tint-${tint}-bold`, usage: 'Illustration, graphique' })),
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
