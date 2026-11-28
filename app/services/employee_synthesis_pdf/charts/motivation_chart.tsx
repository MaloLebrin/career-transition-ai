import { Text, View } from '@react-pdf/renderer'
import { RANKING_EXTREMES_COUNT, rankingExtremes } from '#shared/helpers/exercise/ranking_extremes'
import { safeArr, safeObj } from './chart_helpers.js'

// ─── MOTIVATION ──────────────────────────────────────────────────────────────

export function MotivationChart({ data }: { data: unknown }) {
  const d = safeObj(data)
  const { top, bottom } = rankingExtremes(safeArr(d.ranked))

  if (top.length === 0) return null

  return (
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
      {/* Premières */}
      <View
        style={{
          flex: 1,
          backgroundColor: '#f0fdf4',
          borderRadius: 6,
          padding: 10,
          borderWidth: 1,
          borderColor: '#bbf7d0',
        }}
      >
        <Text
          style={{
            fontSize: 8,
            fontFamily: 'Helvetica-Bold',
            color: '#16a34a',
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          LES {RANKING_EXTREMES_COUNT} PREMIÈRES
        </Text>
        {top.map((item) => (
          <View
            key={item.rank}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: '#16a34a',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 9, color: '#fff', fontFamily: 'Helvetica-Bold' }}>
                {item.rank}
              </Text>
            </View>
            <Text style={{ fontSize: 9, color: '#374151', fontFamily: 'Helvetica-Bold', flex: 1 }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Dernières */}
      <View
        style={{
          flex: 1,
          backgroundColor: '#fff1f2',
          borderRadius: 6,
          padding: 10,
          borderWidth: 1,
          borderColor: '#fecdd3',
        }}
      >
        <Text
          style={{
            fontSize: 8,
            fontFamily: 'Helvetica-Bold',
            color: '#e11d48',
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          LES {RANKING_EXTREMES_COUNT} DERNIÈRES
        </Text>
        {bottom.map((item) => (
          <View
            key={item.rank}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: '#e11d48',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 9, color: '#fff', fontFamily: 'Helvetica-Bold' }}>
                {item.rank}
              </Text>
            </View>
            <Text style={{ fontSize: 9, color: '#374151', flex: 1 }}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
