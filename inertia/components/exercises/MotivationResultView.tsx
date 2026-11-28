import React, { useState } from 'react'
import { formatDate } from '../../../shared/helpers/date'
import MotivationMatrix from './motivation/MotivationMatrix'
import {
  RANKING_EXTREMES_COUNT as COUNT,
  rankingExtremes,
} from '#shared/helpers/exercise/ranking_extremes'
import { MotivationRankingColumn } from './motivation/MotivationRankingColumn'

interface Props {
  data: {
    ranked: string[]
    scores: Record<string, number>
    matrix: (number | null)[][]
  }
  date: string
  duration: number
}

const MotivationResultView: React.FC<Props> = ({ data, date, duration }) => {
  const [showMatrix, setShowMatrix] = useState(true)

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins}min ${secs}s`
  }

  const ranked = Array.isArray(data.ranked) ? data.ranked : []
  const { top, bottom } = rankingExtremes(ranked)
  const matrix = Array.isArray(data.matrix) ? data.matrix : []

  return (
    <div className="space-y-12 animate-fadeIn">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Date de passage
          </div>
          <div className="text-lg font-black text-slate-900">
            {formatDate(date, { month: 'short', year: 'numeric', day: 'numeric' })}
          </div>
        </div>
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Durée du test
          </div>
          <div className="text-lg font-black text-slate-900">{formatDuration(duration)}</div>
        </div>
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Cohérence globale
          </div>
          <div className="text-lg font-black text-emerald-600">Optimale</div>
        </div>
      </div>

      {ranked.length > 0 && (
        <section className="space-y-4" aria-labelledby="motivation-extremes-title">
          <h5 id="motivation-extremes-title" className="text-xl font-bold text-ink">
            Vos {COUNT} premières et {COUNT} dernières motivations
          </h5>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <MotivationRankingColumn title={`Les ${COUNT} premières`} items={top} tone="lake" />
            <MotivationRankingColumn
              title={`Les ${COUNT} dernières`}
              items={bottom}
              tone="apricot"
            />
          </div>
        </section>
      )}

      {ranked.length > 0 && (
        <section className="space-y-4">
          <h5 className="text-xl font-bold text-ink">Classement</h5>
          <ol className="grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
            {ranked.map((label, idx) => (
              <li key={`${label}-${idx}`} className="flex items-start gap-3">
                <span className="mt-0.5 w-6 shrink-0 text-sm font-semibold tabular-nums text-muted">
                  {idx + 1}
                </span>
                <span className="text-sm leading-snug text-ink">{label}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Matrix View (Spreadsheet Style Replicated) */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h5 className="text-xl font-black text-slate-900 tracking-tight">
            Matrice de Comparaison par Paires
          </h5>
          <button
            onClick={() => setShowMatrix(!showMatrix)}
            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline cursor-pointer disabled:cursor-not-allowed"
          >
            {showMatrix ? 'Replier la matrice' : 'Déplier la matrice'}
          </button>
        </div>

        {showMatrix && <MotivationMatrix matrix={matrix} />}
      </div>
    </div>
  )
}

export default MotivationResultView
