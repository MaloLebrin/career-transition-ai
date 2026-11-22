import { Download, MapPin, ShieldCheck, type LucideIcon } from 'lucide-react'
import React from 'react'
import AppLink from '~/components/ui/AppLink'
import { Container } from '~/components/ui/Container'
import { brandPastel } from '../tints'

const TRUST: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: ShieldCheck,
    title: 'Pseudonymisé avant l’IA',
    description: 'Votre nom et votre e-mail ne sont jamais transmis aux modèles.',
  },
  {
    icon: MapPin,
    title: 'Hébergé dans l’Union européenne',
    description: 'Hébergement et traitements dans l’Union européenne.',
  },
  {
    icon: Download,
    title: 'Vos données, votre décision',
    description: 'Exportez ou effacez tout depuis votre profil.',
  },
]

/**
 * Confiance, condensée en trois colonnes courtes (tuile d'icône pastel, titre, une ligne),
 * avec le lien vers la page sécurité.
 */
export const TrustColumns: React.FC = () => (
  <section aria-label="Confiance" className="bg-canvas">
    <Container className="flex flex-col gap-8 py-14 md:py-16">
      <ul className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {TRUST.map((item, index) => {
          const tint = brandPastel(index)
          const Icon = item.icon
          return (
            <li key={item.title} className="flex gap-4">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tint.surface} ${tint.ink}`}
                aria-hidden="true"
                data-testid="trust-icon"
              >
                <Icon size={22} />
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-title-sm">{item.title}</h3>
                <p className="text-sm text-muted">{item.description}</p>
              </div>
            </li>
          )
        })}
      </ul>
      <AppLink href="/securite" className="text-sm font-bold text-accent hover:underline">
        Lire la page sécurité
      </AppLink>
    </Container>
  </section>
)
