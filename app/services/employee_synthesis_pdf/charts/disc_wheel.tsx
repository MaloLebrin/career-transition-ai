import { Fragment, useId } from 'react'
import {
  Circle as SvgCircle,
  Defs as SvgDefs,
  LinearGradient as SvgLinearGradient,
  Path as SvgPath,
  Stop as SvgStop,
  Svg,
} from '@react-pdf/renderer'
import {
  DISC_WHEEL_RINGS,
  DISC_WHEEL_TRAIT_ANGLES,
  DISC_WHEEL_TRAITS,
  DISC_WHEEL_ZONES,
} from '#shared/constants/disc_wheel'
import {
  discWheelPoint,
  discWheelPosition,
  discWheelZoneBounds,
  polarToXY,
  sectorPath,
} from '#shared/helpers/exercise/disc_wheel_geometry'
import { C } from '../styles.js'
import { SvgText } from './chart_helpers.js'
import { DISC_COLORS, type DiscScoresPdf } from './disc_palette.js'

/** Roue DISC statique : huit zones, anneaux d'intensité et point du candidat. */
export function DiscWheelPdf({ scores }: { scores: DiscScoresPdf }) {
  const WIDTH = 250
  const HEIGHT = 190
  const CX = WIDTH / 2
  const CY = HEIGHT / 2
  const R = 66
  const ringRadii = DISC_WHEEL_RINGS.map((ring) => ring.to * R)
  const ringOpacity = [0.35, 0.6, 0.9]
  const position = discWheelPosition(scores)
  const point = discWheelPoint(position, CX, CY, R)
  // Ids de dégradé uniques par roue : deux roues dans un même PDF ne se mélangent pas.
  const gradientPrefix = `disc-pdf-${useId().replace(/:/g, '')}`

  return (
    <Svg width={WIDTH} height={HEIGHT}>
      <SvgDefs>
        {DISC_WHEEL_ZONES.filter((zone) => zone.traits.length === 2).map((zone) => {
          const { start, end } = discWheelZoneBounds(zone)
          const from = polarToXY(CX, CY, R, start)
          const to = polarToXY(CX, CY, R, end)
          const [first, second] = zone.traits
          return (
            <SvgLinearGradient
              key={zone.key}
              id={`${gradientPrefix}-${zone.key}`}
              gradientUnits="userSpaceOnUse"
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            >
              <SvgStop offset="0%" stopColor={DISC_COLORS[first].bar} />
              <SvgStop offset="100%" stopColor={DISC_COLORS[second ?? first].bar} />
            </SvgLinearGradient>
          )
        })}
      </SvgDefs>

      {DISC_WHEEL_ZONES.flatMap((zone) => {
        const { start, end } = discWheelZoneBounds(zone)
        const fill =
          zone.traits.length === 1
            ? DISC_COLORS[zone.traits[0]].bar
            : `url(#${gradientPrefix}-${zone.key})`
        return ringOpacity.map((opacity, index) => (
          <SvgPath
            key={`${zone.key}-${index}`}
            d={sectorPath(CX, CY, ringRadii[index], ringRadii[index + 1], start, end)}
            fill={fill}
            fillOpacity={opacity}
            stroke="#ffffff"
            strokeWidth={1}
          />
        ))
      })}

      <SvgCircle
        cx={CX}
        cy={CY}
        r={ringRadii[0]}
        fill="#ffffff"
        stroke="#e5e7eb"
        strokeWidth={0.8}
      />

      {DISC_WHEEL_ZONES.map((zone) => {
        const sin = Math.sin((zone.angle * Math.PI) / 180)
        const cos = Math.cos((zone.angle * Math.PI) / 180)
        const at = polarToXY(CX, CY, R + 6, zone.angle)
        const anchor = Math.abs(sin) < 0.2 ? 'middle' : sin > 0 ? 'start' : 'end'
        const dy = Math.abs(sin) < 0.2 ? (cos > 0 ? -2 : 7) : 3
        const isCandidate = zone.key === position.zone?.key
        return (
          <SvgText
            key={zone.key}
            x={at.x}
            y={at.y + dy}
            textAnchor={anchor}
            style={{ fontSize: 7, fontFamily: 'Helvetica-Bold' }}
            fill={isCandidate ? C.primary : C.dark}
          >
            {zone.label}
          </SvgText>
        )
      })}

      {DISC_WHEEL_TRAITS.map((trait) => {
        const at = polarToXY(
          CX,
          CY,
          (ringRadii[0] + ringRadii[1]) / 2,
          DISC_WHEEL_TRAIT_ANGLES[trait]
        )
        return (
          <Fragment key={trait}>
            <SvgCircle cx={at.x} cy={at.y} r={5} fill="#ffffff" />
            <SvgText
              x={at.x}
              y={at.y + 2}
              textAnchor="middle"
              style={{ fontSize: 5.5, fontFamily: 'Helvetica-Bold' }}
              fill={C.dark}
            >
              {trait}
            </SvgText>
          </Fragment>
        )
      })}

      <SvgCircle cx={point.x} cy={point.y} r={8} fill={C.dark} fillOpacity={0.15} />
      <SvgCircle cx={point.x} cy={point.y} r={4} fill={C.dark} stroke="#ffffff" strokeWidth={1.5} />
    </Svg>
  )
}
