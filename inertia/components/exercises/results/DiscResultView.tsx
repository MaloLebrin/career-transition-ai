import React, { useMemo } from 'react'
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import {
  DISC_TRAIT_PALETTE,
  DISC_WHEEL_TRAIT_ANGLES,
  DISC_WHEEL_TRAITS,
  type DiscWheelTrait,
} from '#shared/constants/disc_wheel'
import { discRadarDomain, discRadarTicks } from '#shared/helpers/exercise/disc_wheel_geometry'
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

/**
 * Recharts écrit les couleurs en attributs SVG, qui ne lisent pas les variables CSS :
 * hex des tokens `ink`, `muted` et `hairline-strong` (`inertia/css/app.css`).
 */
const CHART_INK = '#1f1400'
const CHART_MUTED = '#5c4a1e'
const CHART_GRID = '#ffd96a'

/** Recharts compte les angles depuis 3 h, sens trigonométrique : D en haut à droite, comme la roue. */
const RADAR_START_ANGLE = 90 - DISC_WHEEL_TRAIT_ANGLES.D

type RadarDotProps = { cx?: number; cy?: number; payload?: { trait: DiscWheelTrait } }

function TraitDot({ cx, cy, payload }: RadarDotProps) {
  if (cx === undefined || cy === undefined || !payload) return <g />
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={DISC_TRAIT_PALETTE[payload.trait].boldHex}
      stroke="#ffffff"
      strokeWidth={2}
    />
  )
}

const DiscResultView: React.FC<Props> = ({ scores }) => {
  const percent = useMemo(
    () => ({
      D: Number(scores.D) || 0,
      I: Number(scores.I) || 0,
      S: Number(scores.S) || 0,
      C: Number(scores.C) || 0,
    }),
    [scores.D, scores.I, scores.S, scores.C]
  )
  const domain = discRadarDomain(percent)
  const ticks = discRadarTicks(domain)
  const discData = DISC_WHEEL_TRAITS.map((trait) => ({ trait, value: percent[trait] }))

  return (
    <div className="space-y-10">
      <DiscResultSummary percent={percent} showAbout={false} />

      <section
        aria-labelledby="disc-radar-title"
        className="rounded-2xl border border-hairline bg-surface-soft p-6 sm:p-8"
      >
        <h4 id="disc-radar-title" className="text-title-md text-ink">
          Équilibre des quatre traits
        </h4>
        <p className="mt-1 text-sm text-muted">
          Échelle resserrée de {domain[0]} à {domain[1]} % pour faire ressortir les écarts entre vos
          traits.
        </p>
        <div className="mt-4 h-[360px]" data-testid="disc-radar">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              cx="50%"
              cy="50%"
              outerRadius="75%"
              data={discData}
              startAngle={RADAR_START_ANGLE}
              endAngle={RADAR_START_ANGLE - 360}
            >
              <PolarGrid stroke={CHART_GRID} gridType="circle" />
              <PolarAngleAxis
                dataKey="trait"
                tickFormatter={(trait: DiscWheelTrait) => `${trait} · ${percent[trait]} %`}
                tick={{ fontSize: 13, fontWeight: 800, fill: CHART_INK }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={domain}
                ticks={ticks as any}
                tickFormatter={(value: number) => `${value} %`}
                tick={{ fontSize: 11, fill: CHART_MUTED }}
                axisLine={false}
                allowDataOverflow
              />
              <Radar
                name="DISC"
                dataKey="value"
                stroke={CHART_INK}
                strokeWidth={2}
                fill={DISC_TRAIT_PALETTE.I.boldHex}
                fillOpacity={0.35}
                dot={(props: RadarDotProps & { key?: string }) => (
                  <TraitDot key={props.payload?.trait} {...props} />
                )}
                isAnimationActive={false}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}

export default DiscResultView
