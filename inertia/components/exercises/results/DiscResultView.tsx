import React from 'react'
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import DiscResultSummary from '../disc/DiscResultSummary'

interface DiscScores {
  D: number
  I: number
  S: number
  C: number
}

interface Props {
  scores: DiscScores
}

const DiscResultView: React.FC<Props> = ({ scores }) => {
  const discData = [
    { trait: 'D', value: Number(scores.D) || 0, full: 100 },
    { trait: 'I', value: Number(scores.I) || 0, full: 100 },
    { trait: 'S', value: Number(scores.S) || 0, full: 100 },
    { trait: 'C', value: Number(scores.C) || 0, full: 100 },
  ]

  return (
    <div className="space-y-10">
      <DiscResultSummary
        percent={{
          D: Number(scores.D) || 0,
          I: Number(scores.I) || 0,
          S: Number(scores.S) || 0,
          C: Number(scores.C) || 0,
        }}
        showAbout={false}
      />

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
    </div>
  )
}

export default DiscResultView
