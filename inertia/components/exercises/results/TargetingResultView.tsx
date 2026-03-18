import React from 'react'

interface Target {
  id?: number | string
  name: string
  type: string
  comment?: string
  advisorComment?: string
}

interface Props {
  targets: Target[]
}

const TargetingResultView: React.FC<Props> = ({ targets }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
        Organismes de formation ou d&apos;emploi ciblés
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {targets.map((target, i) => (
          <div
            key={target.id ?? i}
            className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h4 className="text-lg font-black text-slate-900 tracking-tight">
                {target.name ?? '—'}
              </h4>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap px-3 py-1 rounded-full bg-slate-100">
                {target.type ?? '—'}
              </span>
            </div>
            {target.comment && (
              <p className="text-sm text-slate-600 leading-relaxed mb-3 italic">
                &quot;{target.comment}&quot;
              </p>
            )}
            {target.advisorComment && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[9px] font-black text-brand-sage uppercase tracking-widest">
                  Note accompagnateur
                </span>
                <p className="text-sm text-slate-700 leading-relaxed mt-1">
                  {target.advisorComment}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      {targets.length === 0 && (
        <p className="text-slate-400 italic text-sm">Aucune cible enregistrée.</p>
      )}
    </div>
  )
}

export default TargetingResultView
