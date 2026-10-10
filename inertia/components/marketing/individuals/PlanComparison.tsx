import { Check, Minus } from 'lucide-react'
import React from 'react'
import { EXERCISE_LIST } from '#shared/constants/exercises'
import { FREE_EXERCISES } from './copy'

const PAID_COUNT = EXERCISE_LIST.length - FREE_EXERCISES.length

/** Lignes de la comparaison : [libellé, gratuit, forfait]. */
const ROWS: Array<[string, boolean, boolean]> = [
  [`${FREE_EXERCISES.map((exercise) => exercise.title).join(' et ')}`, true, true],
  ['Résultats et analyse IA de ces exercices', true, true],
  [`Les ${PAID_COUNT} autres exercices du parcours`, false, true],
  ['Analyses IA de chaque exercice', false, true],
  ['Synthèse de parcours et export PDF', false, true],
  ['Demande d’accompagnement par un expert', false, true],
]

const Mark: React.FC<{ included: boolean }> = ({ included }) =>
  included ? (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success-soft text-success">
      <Check className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Inclus</span>
    </span>
  ) : (
    <span className="inline-flex h-6 w-6 items-center justify-center text-muted-soft">
      <Minus className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Non inclus</span>
    </span>
  )

/** Tableau « Gratuit / Forfait » : ce que débloque le paiement, ligne par ligne. */
export const PlanComparison: React.FC = () => (
  <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card">
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Ce qui est inclus, gratuitement et avec le forfait</caption>
      <thead className="bg-surface-soft">
        <tr>
          <th scope="col" className="px-5 py-4 font-semibold text-ink">
            Ce qui est inclus
          </th>
          <th scope="col" className="w-24 px-3 py-4 text-center font-semibold text-ink sm:w-32">
            Gratuit
          </th>
          <th scope="col" className="w-24 px-3 py-4 text-center font-semibold text-ink sm:w-32">
            Forfait
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-hairline">
        {ROWS.map(([label, free, paid]) => (
          <tr key={label} className="transition-colors hover:bg-surface-soft/60">
            <th scope="row" className="px-5 py-4 font-normal text-ink-soft">
              {label}
            </th>
            <td className="px-3 py-4 text-center">
              <Mark included={free} />
            </td>
            <td className="px-3 py-4 text-center">
              <Mark included={paid} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
