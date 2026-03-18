import React from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface LifeCurvePoint {
  year: number
  satisfaction: number
}

interface Props {
  points: LifeCurvePoint[]
  reflection: Record<string, string>
}

const LifeCurveResultView: React.FC<Props> = ({ points, reflection }) => {
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
        {Object.entries(reflection).map(([key, value]) => (
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

export default LifeCurveResultView
