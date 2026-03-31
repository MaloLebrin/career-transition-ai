import React from 'react'

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
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
          Hiérarchie des valeurs
        </div>
        {selectedValues.length === 0 ? (
          <div className="text-slate-400 italic font-medium">Aucune valeur enregistrée.</div>
        ) : (
          <ol className="space-y-2">
            {selectedValues.map((v, idx) => (
              <li key={`${v}-${idx}`} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-brand-sage text-white flex items-center justify-center text-xs font-black">
                  {idx + 1}
                </span>
                <span className="font-bold text-slate-900">{v}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
          Figures d’inspiration
        </div>
        {peopleExercise.length === 0 ? (
          <div className="text-slate-400 italic font-medium">Aucune figure renseignée.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {peopleExercise.map((p, idx) => (
              <div key={idx} className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                <div className="text-xs font-black text-slate-800">
                  {p?.name?.trim() ? p.name : `Personne ${idx + 1}`}
                </div>
                <div className="mt-2 text-xs text-slate-600 whitespace-pre-wrap">
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

