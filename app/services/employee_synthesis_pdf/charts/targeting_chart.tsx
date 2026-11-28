import { Text, View } from '@react-pdf/renderer'
import { C } from '../styles.js'
import { safeArr, safeObj } from './chart_helpers.js'

// ─── TARGETING ────────────────────────────────────────────────────────────────

export function TargetingChart({ data }: { data: unknown }) {
  const d = safeObj(data)
  const targets = safeArr(d.targets) as Array<{
    name?: string
    type?: string
    comment?: string
    advisorComment?: string
  }>

  if (targets.length === 0) return null

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
      {targets.map((t, i) => (
        <View
          key={i}
          style={{
            width: '47%',
            backgroundColor: C.superLight,
            borderRadius: 6,
            padding: 10,
            borderWidth: 1,
            borderColor: C.lightGray,
          }}
        >
          <Text
            style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.dark, marginBottom: 2 }}
          >
            {t.name || `Cible ${i + 1}`}
          </Text>
          {t.type && (
            <View
              style={{
                backgroundColor: C.primaryBg,
                borderRadius: 3,
                paddingHorizontal: 6,
                paddingVertical: 2,
                alignSelf: 'flex-start',
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 8, color: C.primary, fontFamily: 'Helvetica-Bold' }}>
                {t.type}
              </Text>
            </View>
          )}
          {t.comment && (
            <Text style={{ fontSize: 8, color: C.medium, lineHeight: 1.4, marginBottom: 2 }}>
              {t.comment}
            </Text>
          )}
          {t.advisorComment && (
            <Text style={{ fontSize: 8, color: C.gray, lineHeight: 1.4 }}>{t.advisorComment}</Text>
          )}
        </View>
      ))}
    </View>
  )
}
