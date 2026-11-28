import { Text, View } from '@react-pdf/renderer'
import { C } from '../styles.js'
import { safeArr, safeObj } from './chart_helpers.js'

// ─── VALUES ───────────────────────────────────────────────────────────────────

export function ValuesChart({ data }: { data: unknown }) {
  const d = safeObj(data)
  const selectedValues = safeArr(d.selectedValues) as string[]
  const peopleExercise = safeArr(d.peopleExercise) as Array<{ name?: string; values?: string }>

  if (selectedValues.length === 0) return null

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Hierarchy */}
      <View
        style={{
          backgroundColor: '#f9fafb',
          borderRadius: 6,
          padding: 10,
          borderWidth: 1,
          borderColor: C.lightGray,
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 8,
            fontFamily: 'Helvetica-Bold',
            color: C.gray,
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          HIÉRARCHIE DES VALEURS
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {selectedValues.map((v, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: C.primaryBg,
                borderRadius: 4,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.primary }}>
                {i + 1}.
              </Text>
              <Text style={{ fontSize: 9, color: C.medium, fontFamily: 'Helvetica-Bold' }}>
                {v}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Inspiration figures */}
      {peopleExercise.length > 0 && (
        <View
          style={{
            backgroundColor: '#f9fafb',
            borderRadius: 6,
            padding: 10,
            borderWidth: 1,
            borderColor: C.lightGray,
          }}
        >
          <Text
            style={{
              fontSize: 8,
              fontFamily: 'Helvetica-Bold',
              color: C.gray,
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            FIGURES D'INSPIRATION
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {peopleExercise.slice(0, 6).map((p, i) => (
              <View
                key={i}
                style={{
                  width: '31%',
                  backgroundColor: C.white,
                  borderRadius: 4,
                  padding: 7,
                  borderWidth: 1,
                  borderColor: C.lightGray,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: 'Helvetica-Bold',
                    color: C.dark,
                    marginBottom: 2,
                  }}
                >
                  {p?.name?.trim() || `Personne ${i + 1}`}
                </Text>
                <Text style={{ fontSize: 8, color: C.gray, lineHeight: 1.4 }}>
                  {p?.values?.trim() || '—'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}
