import { Text, View } from '@react-pdf/renderer'
import { C } from '../styles.js'
import { safeNum, safeObj } from './chart_helpers.js'

// ─── Personality traits (mirror prod labels) ──────────────────────────────────

const PERSONALITY_FIELDS = [
  { key: 'openness', label: "Ouverture d'esprit" },
  { key: 'conscientiousness', label: 'Conscience professionnelle' },
  { key: 'extraversion', label: 'Extraversion' },
  { key: 'agreeableness', label: 'Amabilité' },
  { key: 'neuroticism', label: 'Stabilité émotionnelle' },
] as const

// ─── PERSONALITY ─────────────────────────────────────────────────────────────

export function PersonalityChart({ data }: { data: unknown }) {
  const d = safeObj(data)
  const BAR_WIDTH = 180

  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {PERSONALITY_FIELDS.map(({ key, label }) => {
          const value = Math.min(10, Math.max(0, safeNum(d[key])))
          const filled = Math.round((value / 10) * BAR_WIDTH)
          return (
            <View key={key} style={{ width: '47%' }}>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}
              >
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.dark }}>
                  {label}
                </Text>
                <Text style={{ fontSize: 9, color: C.gray }}>{value}/10</Text>
              </View>
              <View style={{ height: 8, backgroundColor: C.lightGray, borderRadius: 4 }}>
                <View
                  style={{ width: filled, height: 8, backgroundColor: '#f59e0b', borderRadius: 4 }}
                />
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}
