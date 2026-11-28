import { Fragment } from 'react'
import {
  Circle as SvgCircle,
  Line as SvgLine,
  Polygon as SvgPolygon,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer'
import {
  DISC_WHEEL_TRAIT_ANGLES,
  DISC_WHEEL_TRAITS,
  type DiscWheelTrait,
} from '#shared/constants/disc_wheel'
import {
  discRadarDomain,
  discRadarRatio,
  discRadarTicks,
  polarToXY,
} from '#shared/helpers/exercise/disc_wheel_geometry'
import { C } from '../styles.js'
import { SvgText } from './chart_helpers.js'
import { DISC_COLORS, type DiscScoresPdf } from './disc_palette.js'

/** Radar resserré autour des scores (même domaine que le dashboard), D en haut à droite. */
export function DiscRadar({ scores }: { scores: DiscScoresPdf }) {
  const SIZE = 160
  const CX = SIZE / 2
  const CY = SIZE / 2
  const R_MAX = 58
  const domain = discRadarDomain(scores)
  const ticks = discRadarTicks(domain)

  const pointFor = (trait: DiscWheelTrait, ratio: number) =>
    polarToXY(CX, CY, ratio * R_MAX, DISC_WHEEL_TRAIT_ANGLES[trait])

  const radarPoints = DISC_WHEEL_TRAITS.map((t) => {
    const pt = pointFor(t, discRadarRatio(scores[t], domain))
    return `${pt.x},${pt.y}`
  }).join(' ')

  return (
    <View style={{ width: SIZE, alignItems: 'center' }}>
      <Svg width={SIZE} height={SIZE}>
        {ticks.map((tick) => {
          const r = discRadarRatio(tick, domain) * R_MAX
          return (
            <SvgCircle
              key={tick}
              cx={CX}
              cy={CY}
              r={Math.max(0.5, r)}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={tick === domain[1] ? 1 : 0.5}
            />
          )
        })}
        {ticks.slice(1).map((tick) => (
          <SvgText
            key={`tick-${tick}`}
            x={CX + 2}
            y={CY - discRadarRatio(tick, domain) * R_MAX - 1}
            style={{ fontSize: 5 }}
            fill={C.medium}
          >
            {tick} %
          </SvgText>
        ))}
        {DISC_WHEEL_TRAITS.map((t) => {
          const pt = pointFor(t, 1)
          return (
            <SvgLine
              key={t}
              x1={CX}
              y1={CY}
              x2={pt.x}
              y2={pt.y}
              stroke="#e5e7eb"
              strokeWidth={0.5}
            />
          )
        })}
        <SvgPolygon
          points={radarPoints}
          fill={DISC_COLORS.I.bar}
          fillOpacity={0.35}
          stroke={C.dark}
          strokeWidth={1.2}
        />
        {DISC_WHEEL_TRAITS.map((t) => {
          const label = pointFor(t, 1.22)
          const dot = pointFor(t, discRadarRatio(scores[t], domain))
          return (
            <Fragment key={t}>
              <SvgCircle cx={label.x} cy={label.y} r={8} fill={DISC_COLORS[t].bg} />
              <SvgText
                x={label.x}
                y={label.y + 3}
                textAnchor="middle"
                style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}
                fill={DISC_COLORS[t].ink}
              >
                {t}
              </SvgText>
              <SvgCircle
                cx={dot.x}
                cy={dot.y}
                r={3}
                fill={DISC_COLORS[t].bar}
                stroke="#ffffff"
                strokeWidth={1}
              />
            </Fragment>
          )
        })}
      </Svg>
      <Text style={{ fontSize: 7, color: C.medium, marginTop: 2 }}>
        Échelle resserrée : {domain[0]} à {domain[1]} %
      </Text>
    </View>
  )
}
