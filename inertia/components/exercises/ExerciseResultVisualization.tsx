import React from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ExerciseResult, ExerciseType } from '../../types'
import MotivationResultView from './MotivationResultView'

interface Props {
  result: ExerciseResult
}

export default function ExerciseResultVisualization({ result }: Props) {
  const data = result.data ?? {}
  const resultType = (result.type ?? '').toUpperCase().replace(/-/g, '_')

  switch (resultType) {
    case ExerciseType.SKILL_MAPPING: {
      const mapping = Array.isArray(data.mapping) ? data.mapping : []
      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/20 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10">
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                Poste analysé
              </div>
              <div className="text-3xl font-black tracking-tight">{data.jobTitle ?? '—'}</div>
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
                  {mapping.map((row: any, i: number) => (
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
    case 'MOTIVATION': {
      const motivationData = {
        ranked: Array.isArray(data.ranked) ? data.ranked : [],
        scores: data.scores && typeof data.scores === 'object' ? data.scores : {},
        matrix: Array.isArray(data.matrix) ? data.matrix : [],
      }
      return (
        <MotivationResultView
          data={motivationData}
          date={result.date}
          duration={result.duration}
        />
      )
    }
    case 'LIFE_CURVE': {
      const points = Array.isArray(data.points) ? data.points : []
      return (
        <div className="space-y-8 animate-fadeIn">
          <div className="h-[400px] bg-slate-50 p-8 rounded-[48px] border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={points}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="year"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                />
                <YAxis
                  domain={[0, 10]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '24px',
                    border: 'none',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                    fontWeight: 900,
                  }}
                  itemStyle={{ color: '#6366f1' }}
                />
                <ReferenceLine y={5} stroke="#cbd5e1" strokeDasharray="5 5" />
                <Line
                  type="monotone"
                  dataKey="satisfaction"
                  stroke="#6366f1"
                  strokeWidth={4}
                  dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(data.reflection || {}).map(([key, value]: [string, any]) => (
              <div
                key={key}
                className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm"
              >
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {key}
                </div>
                <div className="text-sm font-bold text-slate-700 leading-relaxed">{String(value)}</div>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'DISC': {
      const discData = [
        { trait: 'D', value: Number(data.D) || 0, full: 100 },
        { trait: 'I', value: Number(data.I) || 0, full: 100 },
        { trait: 'S', value: Number(data.S) || 0, full: 100 },
        { trait: 'C', value: Number(data.C) || 0, full: 100 },
      ]
      return (
        <div className="flex justify-center h-[350px] bg-slate-50 rounded-[48px] p-8 border border-slate-100">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={discData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="trait"
                tick={{ fontSize: 14, fontWeight: 900, fill: '#1e293b' }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
              <Radar
                name="DISC"
                dataKey="value"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )
    }
    case 'CIRCLE_OF_CONTROL':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-violet-50 rounded-[48px] border border-violet-100 shadow-sm">
            <h4 className="text-sm font-black text-violet-600 uppercase mb-6 flex items-center">
              <span className="w-2 h-2 bg-violet-500 rounded-full mr-2" />
              Sous contrôle
            </h4>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(data.inControl) ? data.inControl : []).map(
                (item: string, i: number) => (
                  <span
                    key={i}
                    className="text-[10px] bg-white px-4 py-2 rounded-xl border border-violet-100 font-black text-slate-700 uppercase tracking-widest"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>
          <div className="p-8 bg-pink-50 rounded-[48px] border border-pink-100 shadow-sm">
            <h4 className="text-sm font-black text-pink-600 uppercase mb-6 flex items-center">
              <span className="w-2 h-2 bg-pink-500 rounded-full mr-2" />
              Hors contrôle
            </h4>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(data.outControl) ? data.outControl : []).map(
                (item: string, i: number) => (
                  <span
                    key={i}
                    className="text-[10px] bg-white px-4 py-2 rounded-xl border border-pink-100 font-black text-slate-700 uppercase tracking-widest"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      )
    case 'TARGETING': {
      const targets = Array.isArray(data.targets) ? data.targets : []
      return (
        <div className="space-y-6 animate-fadeIn">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
            Organismes de formation ou d&apos;emploi ciblés
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {targets.map((target: any, i: number) => (
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
    default:
      return (
        <pre className="text-xs bg-slate-50 p-6 rounded-[32px] overflow-auto border border-slate-100">
          {JSON.stringify(data, null, 2)}
        </pre>
      )
  }
}
