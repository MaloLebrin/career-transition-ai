import React from 'react'

type Scores = {
  openness?: number
  conscientiousness?: number
  extraversion?: number
  agreeableness?: number
  neuroticism?: number
}

const FIELDS: Array<{ key: keyof Scores; label: string }> = [
  { key: 'openness', label: "Ouverture d'esprit" },
  { key: 'conscientiousness', label: 'Conscience professionnelle' },
  { key: 'extraversion', label: 'Extraversion' },
  { key: 'agreeableness', label: 'Amabilité' },
  { key: 'neuroticism', label: 'Stabilité émotionnelle' },
]

function clamp10(n: unknown): number {
  const v = Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.min(10, Math.max(0, v))
}

export default function PersonalityResultView({ scores }: { scores: Scores }) {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FIELDS.map(({ key, label }) => {
          const value = clamp10(scores?.[key])
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="text-sm font-black text-slate-800">{label}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {value}/10
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(value / 10) * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

