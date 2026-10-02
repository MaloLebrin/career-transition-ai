import React from 'react'
import { LandscapeArt, type LandscapeArtVariant } from '~/components/marketing/LandscapeArt'
import { ShowcaseSection } from './ShowcaseSection'

const VARIANTS: { variant: LandscapeArtVariant; label: string; usage: string; frame: string }[] = [
  {
    variant: 'hero',
    label: 'Panorama',
    usage: 'Hero de la page d’accueil.',
    frame: 'aspect-[3/1] border border-hairline bg-canvas',
  },
  {
    variant: 'dusk',
    label: 'Crépuscule',
    usage: 'Bas de la bande CTA sur ink.',
    frame: 'aspect-[6/1] bg-ink',
  },
  {
    variant: 'horizon',
    label: 'Horizon',
    usage: 'Derrière la carte d’authentification.',
    frame: 'aspect-[5/1] border border-hairline bg-canvas',
  },
]

/** Le seul bloc illustratif : un paysage calme dessiné avec les teintes expressives. */
export const IllustrationShowcase: React.FC = () => (
  <ShowcaseSection
    eyebrow="07"
    title="Illustration"
    description="Un paysage apaisant, en formes plates et teintes expressives, jamais de photo ni de flou."
  >
    <ul className="space-y-6">
      {VARIANTS.map(({ variant, label, usage, frame }) => (
        <li key={variant} className="space-y-2">
          <div className={`overflow-hidden rounded-2xl ${frame}`}>
            <LandscapeArt variant={variant} />
          </div>
          <p className="text-sm text-ink">
            <span className="font-semibold">{label}</span>
            <span className="text-muted"> · {usage}</span>
          </p>
        </li>
      ))}
    </ul>
  </ShowcaseSection>
)
