import React from 'react'
import AppLink from '~/components/ui/AppLink'
import { Container } from '~/components/ui/Container'

const TRUST = [
  {
    title: 'Pseudonymisé avant l’IA',
    description: 'Votre nom et votre e-mail ne sont jamais transmis aux modèles.',
  },
  {
    title: 'Hébergé dans l’Union européenne',
    description: 'Hébergement et traitements dans l’Union européenne.',
  },
  {
    title: 'Vos données, votre décision',
    description: 'Exportez ou effacez tout depuis votre profil.',
  },
]

/** Confiance, condensée en trois colonnes courtes, avec le lien vers la page sécurité. */
export const TrustColumns: React.FC = () => (
  <section aria-label="Confiance" className="bg-canvas">
    <Container className="flex flex-col gap-6 py-14 md:py-16">
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {TRUST.map((item) => (
          <li key={item.title} className="flex flex-col gap-1.5">
            <h3 className="text-title-sm">{item.title}</h3>
            <p className="text-sm text-muted">{item.description}</p>
          </li>
        ))}
      </ul>
      <AppLink href="/securite" className="text-sm font-bold text-accent hover:underline">
        Lire la page sécurité
      </AppLink>
    </Container>
  </section>
)
