import { Text, View } from '@react-pdf/renderer'
import { C } from '../styles.js'
import { safeArr, safeObj } from './chart_helpers.js'

// ─── CIRCLE_OF_CONTROL ────────────────────────────────────────────────────────

export function CircleOfControlChart({ data }: { data: unknown }) {
  const d = safeObj(data)
  const inControl = safeArr(d.inControl) as string[]
  const outControl = safeArr(d.outControl) as string[]

  if (inControl.length === 0 && outControl.length === 0) return null

  const Pill = ({ text, color, bg }: { text: string; color: string; bg: string }) => (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 4,
        paddingHorizontal: 7,
        paddingVertical: 3,
        margin: 2,
      }}
    >
      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color }}>{text}</Text>
    </View>
  )

  return (
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
      {/* In control */}
      <View
        style={{
          flex: 1,
          backgroundColor: '#f5f3ff',
          borderRadius: 6,
          padding: 10,
          borderWidth: 1,
          borderColor: '#ddd6fe',
        }}
      >
        <Text
          style={{
            fontSize: 8,
            fontFamily: 'Helvetica-Bold',
            color: C.primary,
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          SOUS CONTRÔLE
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {inControl.map((item, i) => (
            <Pill key={i} text={item} color={C.primaryDark} bg={C.white} />
          ))}
        </View>
      </View>

      {/* Out of control */}
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
          HORS CONTRÔLE
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {outControl.map((item, i) => (
            <Pill key={i} text={item} color="#e11d48" bg={C.white} />
          ))}
        </View>
      </View>
    </View>
  )
}
