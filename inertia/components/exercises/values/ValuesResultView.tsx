import React from 'react'
import { valueDefinition } from '../../../constants/values'
import { DefinitionTooltip } from '../../ui/DefinitionTooltip'

type PeopleExercise = { name?: string; values?: string }

export default function ValuesResultView({
  selectedValues,
  peopleExercise,
}: {
  selectedValues: string[]
  peopleExercise: PeopleExercise[]
}) {
  return (
    <div className="space-y-8">
      <div className="bg-surface p-8 rounded-2xl border border-hairline shadow-card">
        <h6 className="text-sm font-semibold text-muted mb-4">Hiérarchie des valeurs</h6>
        {selectedValues.length === 0 ? (
          <div className="text-muted italic">Aucune valeur enregistrée.</div>
        ) : (
          <ol className="space-y-2">
            {selectedValues.map((v, idx) => (
              <li key={`${v}-${idx}`} className="flex items-center gap-3">
                <span className="w-7 h-7 shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold tabular-nums">
                  {idx + 1}
                </span>
                <span className="font-bold text-ink">
                  <DefinitionTooltip label={v} definition={valueDefinition(v)} />
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="bg-surface p-8 rounded-2xl border border-hairline shadow-card">
        <h6 className="text-sm font-semibold text-muted mb-4">Figures d’inspiration</h6>
        {peopleExercise.length === 0 ? (
          <div className="text-muted italic">Aucune figure renseignée.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {peopleExercise.map((p, idx) => (
              <div key={idx} className="rounded-xl border border-hairline bg-surface-soft p-5">
                <div className="text-xs font-bold text-ink">
                  {p?.name?.trim() ? p.name : `Personne ${idx + 1}`}
                </div>
                <div className="mt-2 text-xs text-muted whitespace-pre-wrap">
                  {p?.values?.trim() ? p.values : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
