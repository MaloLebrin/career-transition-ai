import { EXERCISE_LIST } from '#shared/constants/exercises'
import React from 'react'
import Badge, { type BadgeTone } from '~/components/ui/Badge'
import { Logo } from '~/components/ui/Logo'

type MockStatus = 'done' | 'current' | 'todo'

const STATUS: Record<MockStatus, { label: string; tone: BadgeTone }> = {
  done: { label: 'Terminé', tone: 'success' },
  current: { label: 'En cours', tone: 'primary' },
  todo: { label: 'À faire', tone: 'neutral' },
}

const NAV_ITEMS = ['Bureau', 'Candidats', 'Exercices', 'Synthèses']

/**
 * Aperçu statique du dashboard conseiller, construit avec les primitives du
 * design system : parcours d'un candidat fictif sur les exercices réels.
 * Aucun chiffre inventé, aucune donnée réelle.
 */
export const ProductMockup: React.FC = () => {
  const steps = EXERCISE_LIST.slice(0, 5).map((exercise, index) => ({
    title: exercise.title,
    status: (index < 2 ? 'done' : index === 2 ? 'current' : 'todo') as MockStatus,
  }))

  return (
    <div
      className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-raised"
      role="img"
      aria-label="Aperçu du tableau de bord conseiller : parcours d'un candidat et synthèse"
    >
      <div
        className="flex h-10 items-center gap-1.5 border-b border-hairline bg-surface-soft px-4"
        aria-hidden="true"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-hairline-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-hairline-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-hairline-strong" />
      </div>
      <div className="grid grid-cols-12" aria-hidden="true">
        <aside className="col-span-3 hidden space-y-5 border-r border-hairline p-4 sm:block">
          <Logo size="sm" showText={false} />
          <ul className="space-y-1">
            {NAV_ITEMS.map((item, index) => (
              <li
                key={item}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                  index === 1 ? 'bg-primary-soft text-primary' : 'text-muted'
                }`}
              >
                {item}
              </li>
            ))}
          </ul>
        </aside>
        <div className="col-span-12 space-y-4 p-4 sm:col-span-9 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-caption text-muted">Candidat</p>
              <p className="text-sm font-semibold text-ink">C. Durand · Bilan en cours</p>
            </div>
            <Badge variant="primary" dot>
              Étape 3 sur 8
            </Badge>
          </div>
          <ul className="divide-y divide-hairline rounded-lg border border-hairline">
            {steps.map((step) => (
              <li key={step.title} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="truncate text-xs font-medium text-ink">{step.title}</span>
                <Badge variant={STATUS[step.status].tone}>{STATUS[step.status].label}</Badge>
              </li>
            ))}
          </ul>
          <div className="rounded-lg border border-hairline bg-surface-soft p-3">
            <p className="text-caption text-primary">Synthèse assistée · à relire</p>
            <div className="mt-2 space-y-1.5">
              <span className="block h-2 w-11/12 rounded-full bg-hairline-strong" />
              <span className="block h-2 w-4/5 rounded-full bg-hairline-strong" />
              <span className="block h-2 w-2/3 rounded-full bg-hairline-strong" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
