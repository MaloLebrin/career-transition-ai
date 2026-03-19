import React, { useState } from 'react'
import { formatDate } from '../../../shared/helpers/date'
import { MOTIVATIONS_LIST } from '../../constants'

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
  const top3 = ranked.slice(0, 3)
  const bottom3 = [...ranked].reverse().slice(0, 3)
  const matrix = Array.isArray(data.matrix) ? data.matrix : []
  const getMatrixCell = (i: number, j: number): number | null => {
    const row = matrix[i]
    if (!Array.isArray(row)) return null
    const val = row[j]
    return typeof val === 'number' ? val : null
  }

  return (
    <div className="space-y-12 animate-fadeIn">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Date de passage
          </div>
          <div className="text-lg font-black text-slate-900">{formatDate(date, { month: 'short', year: 'numeric', day: 'numeric' })}</div>
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

      {/* Extreme Factors Breakdown */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-emerald-50/50 p-8 rounded-[40px] border border-emerald-100">
          <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-6 flex items-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            Top 3 Leviers d'Engagement
          </h5>
          <div className="space-y-4">
            {top3.map((item, i) => (
              <div
                key={i}
                className="flex items-center bg-white p-5 rounded-[24px] shadow-sm border border-emerald-50 group hover:scale-[1.02] transition-all"
              >
                <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm mr-4">
                  {i + 1}
                </span>
                <span className="text-lg font-bold text-slate-800">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-rose-50/50 p-8 rounded-[40px] border border-rose-100">
          <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-6 flex items-center">
            <span className="w-2 h-2 bg-rose-500 rounded-full mr-2"></span>
            Facteurs Neutres ou de Désengagement
          </h5>
          <div className="space-y-4">
            {bottom3.map((item, i) => (
              <div
                key={i}
                className="flex items-center bg-white p-5 rounded-[24px] shadow-sm border border-rose-50 group hover:scale-[1.02] transition-all"
              >
                <span className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-sm mr-4">
                  {i + 1}
                </span>
                <span className="text-lg font-bold text-slate-600">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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

        {showMatrix && (
          <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm animate-slideUp overflow-hidden">
            <div className="mb-6 flex items-center space-x-6">
              <div className="flex items-center text-[9px] font-black text-slate-400 uppercase">
                <div className="w-3 h-3 bg-indigo-100 border border-indigo-200 rounded-sm mr-2 shadow-inner"></div>{' '}
                Décision (ID Vainqueur)
              </div>
              <div className="flex items-center text-[9px] font-black text-slate-400 uppercase">
                <div className="w-3 h-3 bg-sky-600 rounded-sm mr-2"></div> Diagonale (ID 0)
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar pb-6 border rounded-2xl border-slate-100">
              <table className="w-full border-collapse bg-slate-50">
                <thead>
                  <tr>
                    <th className="w-8 h-8 border border-slate-200 bg-white text-[9px] font-black text-slate-400"></th>
                    {Array(22)
                      .fill(null)
                      .map((_, idx) => (
                        <th
                          key={idx}
                          className="w-8 h-8 border border-slate-200 bg-white text-[10px] font-black text-slate-700"
                        >
                          {idx + 1}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {Array(22)
                    .fill(null)
                    .map((_, i) => (
                      <tr key={i}>
                        <td className="w-8 h-8 border border-slate-200 bg-white text-[10px] font-black text-slate-700 text-center">
                          {i + 1}
                        </td>
                        {Array(22)
                          .fill(null)
                          .map((_, j) => {
                            const isDiagonal = i === j
                            const isUpperTriangle = j > i
                            const winner = isUpperTriangle ? getMatrixCell(i, j) : null

                            let bgColor = 'bg-white'
                            let content = ''
                            let textColor = 'text-slate-900'

                            if (isDiagonal) {
                              bgColor = 'bg-sky-600 text-white font-bold'
                              content = '0'
                            } else if (isUpperTriangle && winner !== null) {
                              bgColor = 'bg-sky-100/50'
                              content = (winner + 1).toString()
                              textColor = 'text-sky-900'
                            } else {
                              bgColor = 'bg-slate-50/50'
                            }

                            return (
                              <td
                                key={j}
                                title={
                                  isUpperTriangle
                                    ? `${i + 1}. ${MOTIVATIONS_LIST[i]} vs ${j + 1}. ${MOTIVATIONS_LIST[j]}`
                                    : ''
                                }
                                className={`w-8 h-8 border border-slate-200 text-[10px] font-medium text-center transition-colors hover:bg-indigo-50 ${bgColor} ${textColor}`}
                              >
                                {content}
                              </td>
                            )
                          })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-3 border-t border-slate-50 pt-8">
              {MOTIVATIONS_LIST.map((m, idx) => (
                <div key={idx} className="flex items-center space-x-2 group">
                  <span className="text-[9px] font-black text-indigo-300 w-4 group-hover:text-indigo-600 transition-colors">
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 truncate group-hover:text-slate-900">
                    {m}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MotivationResultView
