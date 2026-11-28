import { describe, expect, test } from 'vitest'
import { SCHWARTZ_VALUES, valueDefinition } from '../../../inertia/constants/values'

describe('inertia/constants/values', () => {
  test('10 valeurs avec libellés uniques et exemples concrets', () => {
    expect(SCHWARTZ_VALUES).toHaveLength(10)

    const labels = SCHWARTZ_VALUES.map((v) => v.label)
    expect(new Set(labels).size).toBe(labels.length)

    const ids = SCHWARTZ_VALUES.map((v) => v.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const value of SCHWARTZ_VALUES) {
      expect(value.label.trim(), value.id).not.toBe('')
      expect(value.definition.trim().length, value.id).toBeGreaterThan(10)
      expect(value.definition.length, value.id).toBeLessThanOrEqual(120)
      expect(value.desc.trim().length, value.id).toBeGreaterThan(10)
      expect(value.portrait.trim().length, value.id).toBeGreaterThan(10)
      expect(value.situation.trim().length, value.id).toBeGreaterThan(10)
    }
  })

  test('valueDefinition retrouve la définition par libellé', () => {
    expect(valueDefinition(SCHWARTZ_VALUES[0].label)).toBe(SCHWARTZ_VALUES[0].definition)
    expect(valueDefinition('Inconnue')).toBeUndefined()
  })
})
