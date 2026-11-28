import { Text, View } from '@react-pdf/renderer'
import { C } from '../styles.js'
import { safeArr, safeObj } from './chart_helpers.js'

// ─── SKILL_MAPPING ────────────────────────────────────────────────────────────

export function SkillMappingChart({ data }: { data: unknown }) {
  const d = safeObj(data)
  const jobTitle = String(d.jobTitle || '')
  const mapping = safeArr(d.mapping) as Array<{
    mission?: string
    activity?: string
    proof?: string
  }>

  if (mapping.length === 0) return null

  const COL = { mission: '35%', activity: '35%', proof: '30%' } as const

  return (
    <View style={{ marginBottom: 8 }}>
      {jobTitle && (
        <View style={{ backgroundColor: C.primary, borderRadius: 4, padding: 8, marginBottom: 6 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.white }}>
            {jobTitle}
          </Text>
        </View>
      )}
      {/* Header row */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: C.primaryBg,
          borderRadius: 4,
          paddingHorizontal: 8,
          paddingVertical: 5,
          marginBottom: 2,
        }}
      >
        {(['Mission', 'Activité', 'Preuve'] as const).map((h, i) => (
          <Text
            key={i}
            style={{
              fontSize: 8,
              fontFamily: 'Helvetica-Bold',
              color: C.primary,
              width: Object.values(COL)[i],
            }}
          >
            {h}
          </Text>
        ))}
      </View>
      {/* Rows */}
      {mapping.map((row, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            paddingHorizontal: 8,
            paddingVertical: 5,
            backgroundColor: i % 2 === 0 ? C.white : C.superLight,
            borderRadius: 2,
          }}
        >
          <Text style={{ fontSize: 8, color: C.medium, width: COL.mission, lineHeight: 1.4 }}>
            {row.mission || '—'}
          </Text>
          <Text style={{ fontSize: 8, color: C.medium, width: COL.activity, lineHeight: 1.4 }}>
            {row.activity || '—'}
          </Text>
          <Text style={{ fontSize: 8, color: C.gray, width: COL.proof, lineHeight: 1.4 }}>
            {row.proof || '—'}
          </Text>
        </View>
      ))}
    </View>
  )
}
