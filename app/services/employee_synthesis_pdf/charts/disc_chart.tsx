import { Text, View } from '@react-pdf/renderer'
import { DISC_WHEEL_TRAITS, type DiscWheelTrait } from '#shared/constants/disc_wheel'
import { discWheelPosition } from '#shared/helpers/exercise/disc_wheel_geometry'
import { C } from '../styles.js'
import { safeNum, safeObj } from './chart_helpers.js'
import { DISC_COLORS, type DiscScoresPdf } from './disc_palette.js'
import { DiscRadar } from './disc_radar.js'
import { DiscWheelPdf } from './disc_wheel.js'

// ─── DISC ─────────────────────────────────────────────────────────────────────

export function DiscChart({ data }: { data: unknown }) {
  const d = safeObj(data)
  const scores: DiscScoresPdf = {
    D: Math.min(100, Math.max(0, safeNum(d.D))),
    I: Math.min(100, Math.max(0, safeNum(d.I))),
    S: Math.min(100, Math.max(0, safeNum(d.S))),
    C: Math.min(100, Math.max(0, safeNum(d.C))),
  }

  // Dominant trait
  const dominant = (Object.entries(scores) as Array<[DiscWheelTrait, number]>).sort(
    (a, b) => b[1] - a[1]
  )[0][0]
  const position = discWheelPosition(scores)

  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
        {/* Left: bars */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 8,
              fontFamily: 'Helvetica-Bold',
              color: C.primary,
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            DOMINANT : {DISC_COLORS[dominant].label.toUpperCase()} ({dominant})
          </Text>
          {DISC_WHEEL_TRAITS.map((trait) => {
            const value = scores[trait]
            const color = DISC_COLORS[trait]
            const barW = Math.round((value / 100) * 220)
            return (
              <View key={trait} style={{ marginBottom: 8 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        backgroundColor: color.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: color.ink }}>
                        {trait}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 9, color: C.medium }}>{color.label}</Text>
                  </View>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: color.ink }}>
                    {value}%
                  </Text>
                </View>
                <View style={{ height: 8, backgroundColor: C.lightGray, borderRadius: 4 }}>
                  <View
                    style={{ width: barW, height: 8, backgroundColor: color.bar, borderRadius: 4 }}
                  />
                </View>
              </View>
            )
          })}
        </View>

        {/* Right: radar */}
        <DiscRadar scores={scores} />
      </View>

      {/* Roue DISC */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <DiscWheelPdf scores={scores} />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 8,
              fontFamily: 'Helvetica-Bold',
              color: C.primary,
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            POSITION SUR LA ROUE
          </Text>
          {position.zone ? (
            <>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.dark }}>
                Zone {position.zone.label} (tendance {position.ring.label})
              </Text>
              <Text style={{ fontSize: 8.5, color: C.medium, marginTop: 3, lineHeight: 1.4 }}>
                {position.zone.description}
              </Text>
              <Text style={{ fontSize: 7.5, color: C.medium, marginTop: 3 }}>
                {position.zone.keywords.join(' · ')}
              </Text>
            </>
          ) : (
            <Text style={{ fontSize: 9, color: C.medium }}>
              Profil équilibré : aucun style ne domine.
            </Text>
          )}
          <Text style={{ fontSize: 7, color: C.medium, marginTop: 6 }}>
            Plus le point est loin du centre, plus le style est marqué.
          </Text>
        </View>
      </View>
    </View>
  )
}
