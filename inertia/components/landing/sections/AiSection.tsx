import { Check, X } from 'lucide-react'
import React from 'react'
import { BulletList } from '~/components/marketing/BulletList'
import { MarketingSection } from '~/components/marketing/MarketingSection'
import Card from '~/components/ui/Card'
import { SectionHeading } from '~/components/ui/SectionHeading'

const PRINCIPLES = [
  {
    title: 'Une première lecture, jamais une conclusion',
    description:
      'La synthèse générée est un point de départ que le conseiller relit, corrige et contextualise en entretien.',
  },
  {
    title: 'Des données pseudonymisées',
    description:
      'Le nom et l’e-mail du candidat sont retirés avant l’envoi au modèle. Aucune donnée ne sert à entraîner l’IA.',
  },
  {
    title: 'Un fournisseur européen',
    description:
      'Les analyses sont confiées à Mistral AI, société française dont les traitements ont lieu dans l’Union européenne.',
  },
]

const DOES = [
  'Résume les réponses aux exercices',
  'Relève les cohérences et les tensions entre valeurs, motivations et comportements',
  'Propose des pistes à discuter en séance',
]

const DOES_NOT = [
  'Ne note pas et ne classe pas les candidats',
  'Ne prend aucune décision d’orientation',
  'Ne voit jamais le nom ni l’e-mail du candidat',
]

/** Le rôle de l'IA, dit sans détour : copilote du conseiller, pas juge du candidat. */
export const AiSection: React.FC = () => (
  <MarketingSection tone="soft" id="ia">
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="space-y-8 lg:col-span-6">
        <SectionHeading
          eyebrow="Intelligence artificielle"
          title="L’IA comme copilote, pas comme verdict."
          description="L’intérêt n’est pas de remplacer l’analyse du conseiller mais de lui faire gagner le temps de la mise en forme pour le rendre à l’écoute."
        />
        <BulletList items={PRINCIPLES} />
      </div>
      <div className="lg:col-span-6">
        <Card padding="lg" className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-title-sm">Ce que l’IA fait</h3>
            <ul className="space-y-2.5">
              {DOES.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-title-sm">Ce qu’elle ne fait pas</h3>
            <ul className="space-y-2.5">
              {DOES_NOT.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  </MarketingSection>
)
