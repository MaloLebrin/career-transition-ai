import { describe, expect, test } from 'vitest'
import { SCHWARTZ_VALUES } from '../../../inertia/constants/values'

describe('inertia/constants/values', () => {
  test('10 valeurs avec libellés uniques et exemples concrets', () => {
    expect(SCHWARTZ_VALUES).toHaveLength(10)

    const labels = SCHWARTZ_VALUES.map((v) => v.label)
    expect(new Set(labels).size).toBe(labels.length)

    const ids = SCHWARTZ_VALUES.map((v) => v.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const value of SCHWARTZ_VALUES) {
      expect(value.label.trim(), value.id).not.toBe('')
      expect(value.desc.trim().length, value.id).toBeGreaterThan(10)
      expect(value.portrait.trim().length, value.id).toBeGreaterThan(10)
      expect(value.situation.trim().length, value.id).toBeGreaterThan(10)
    }
  })
})
