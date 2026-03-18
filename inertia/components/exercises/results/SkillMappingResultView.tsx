import React from 'react'

interface SkillMappingRow {
  mission: string
  activity: string
  proof?: string
}

interface Props {
  jobTitle: string
  mapping: SkillMappingRow[]
}

const SkillMappingResultView: React.FC<Props> = ({ jobTitle, mapping }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/20 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="relative z-10">
          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
            Poste analysé
          </div>
          <div className="text-3xl font-black tracking-tight">{jobTitle ?? '—'}</div>
        </div>
      </div>
      <div className="bg-white border border-slate-100 rounded-[48px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-8 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/4">
                  Mission
                </th>
                <th className="p-8 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/4">
                  Activité
                </th>
                <th className="p-8 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/2">
                  Preuve / Réalisation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mapping.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-8 text-xs font-black text-slate-900 align-top">
                    {row.mission}
                  </td>
                  <td className="p-8 text-xs font-bold text-slate-500 align-top">
                    {row.activity}
                  </td>
                  <td className="p-8 text-xs font-medium text-slate-600 align-top italic">
                    &quot;{row.proof || 'Non documenté'}&quot;
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SkillMappingResultView
