import React from 'react'
import { MOTIVATIONS_LIST } from '../../../constants'

interface MotivationMatrixProps {
  matrix: (number | null)[][]
}

const MATRIX_SIZE = 22

export default function MotivationMatrix({ matrix }: MotivationMatrixProps) {
  const getMatrixCell = (i: number, j: number): number | null => {
    const row = matrix[i]
    if (!Array.isArray(row)) return null
    const val = row[j]
    return typeof val === 'number' ? val : null
  }

  return (
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
              {Array(MATRIX_SIZE)
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
            {Array(MATRIX_SIZE)
              .fill(null)
              .map((_, i) => (
                <tr key={i}>
                  <td className="w-8 h-8 border border-slate-200 bg-white text-[10px] font-black text-slate-700 text-center">
                    {i + 1}
                  </td>
                  {Array(MATRIX_SIZE)
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
  )
}

