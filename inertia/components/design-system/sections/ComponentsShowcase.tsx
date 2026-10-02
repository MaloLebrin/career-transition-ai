import React, { useState } from 'react'
import Badge, { type BadgeTone } from '~/components/ui/Badge'
import Button, { type ButtonSize, type ButtonVariant } from '~/components/ui/Button'
import Card, { type CardVariant } from '~/components/ui/Card'
import { Eyebrow } from '~/components/ui/Eyebrow'
import Input from '~/components/ui/Input'
import { Textarea } from '~/components/ui/Textarea'
import { ShowcaseSection } from './ShowcaseSection'

const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost', 'danger']
const BUTTON_SIZES: ButtonSize[] = ['sm', 'md', 'lg']
const BADGE_TONES: BadgeTone[] = [
  'neutral',
  'primary',
  'success',
  'warning',
  'danger',
  'info',
  'sun',
  'apricot',
  'meadow',
  'lake',
  'lavender',
  'blossom',
  'sky',
]
const CARD_VARIANTS: { variant: CardVariant; label: string; usage: string }[] = [
  {
    variant: 'default',
    label: 'Carte par défaut',
    usage: 'Surface blanche, hairline, ombre card.',
  },
  { variant: 'flat', label: 'Carte plate', usage: 'Contenu secondaire, sans ombre.' },
  {
    variant: 'dark',
    label: 'Carte sombre',
    usage: 'La seule surface ink : CTA, offre mise en avant.',
  },
  { variant: 'sun', label: 'Carte soleil', usage: 'Mise en avant chaude.' },
  { variant: 'accent', label: 'Carte accent', usage: 'Teinte teal, état actif.' },
  { variant: 'primary', label: 'Carte primaire', usage: 'Mise en avant discrète.' },
]

/** Boutons, badges, champs et cartes dans toutes leurs variantes. */
export const ComponentsShowcase: React.FC = () => {
  const [name, setName] = useState('')

  return (
    <>
      <ShowcaseSection
        eyebrow="03"
        title="Boutons"
        description="Cinq variantes (encre, soleil, outline, ghost, danger), trois tailles, jamais d'uppercase."
      >
        <Card padding="md" className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {BUTTON_SIZES.map((size) => (
              <Button key={size} size={size} variant="outline">
                Taille {size}
              </Button>
            ))}
            <Button isLoading>Chargement</Button>
            <Button disabled>Désactivé</Button>
          </div>
        </Card>
      </ShowcaseSection>

      <ShowcaseSection
        eyebrow="04"
        title="Badges"
        description="Tons sémantiques puis teintes expressives pour les catégories."
      >
        <Card padding="md" className="flex flex-wrap gap-2">
          {BADGE_TONES.map((tone) => (
            <Badge key={tone} variant={tone} dot={tone === 'success'}>
              {tone}
            </Badge>
          ))}
        </Card>
      </ShowcaseSection>

      <ShowcaseSection
        eyebrow="05"
        title="Champs"
        description="Label 14 px, champ 40 px, focus accent, erreur sans fond rosé."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card padding="md" className="space-y-4">
            <Input
              label="Nom complet"
              placeholder="Ex : Camille Durand"
              value={name}
              onChange={(e) => setName(e.target.value)}
              hint="Tel qu'il apparaîtra sur la synthèse."
            />
            <Input
              label="Email"
              type="email"
              placeholder="camille@cabinet.fr"
              error="Adresse e-mail invalide"
            />
            <Input label="Mot de passe" type="password" placeholder="••••••••" required />
          </Card>
          <Card padding="md" className="space-y-4">
            <Input label="Petit" sizeVariant="sm" placeholder="36 px" />
            <Input label="Grand" sizeVariant="lg" placeholder="44 px" />
            <Textarea label="Message" placeholder="Contexte, volume de bilans…" rows={3} />
          </Card>
        </div>
      </ShowcaseSection>

      <ShowcaseSection eyebrow="06" title="Cartes" description="Rayon 12 px, padding 24 ou 32 px.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CARD_VARIANTS.map(({ variant, label, usage }) => (
            <Card key={variant} variant={variant} padding="md" className="space-y-2">
              <Eyebrow tone={variant === 'dark' ? 'inverse' : 'accent'}>{variant}</Eyebrow>
              <h3 className={`text-title-md ${variant === 'dark' ? 'text-on-ink' : ''}`}>
                {label}
              </h3>
              <p className={`text-sm ${variant === 'dark' ? 'text-on-ink-soft' : 'text-muted'}`}>
                {usage}
              </p>
            </Card>
          ))}
        </div>
      </ShowcaseSection>
    </>
  )
}
