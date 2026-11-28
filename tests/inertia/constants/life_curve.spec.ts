import { describe, expect, test } from 'vitest'
import {
  LIFE_CURVE_REFLECTION_KEYS,
  LIFE_CURVE_REFLECTION_LABELS,
  LIFE_CURVE_SCALE,
} from '#shared/constants/life_curve'

describe('shared/constants/life_curve', () => {
  test('échelle de 0 à 10, neutre au milieu', () => {
    expect(LIFE_CURVE_SCALE).toEqual({ MIN: 0, MAX: 10, NEUTRAL: 5 })
  })

  test('un intitulé par question de réflexion, dans l’ordre de l’exercice', () => {
    expect(LIFE_CURVE_REFLECTION_KEYS).toEqual([
      'form',
      'mostlySatisfied',
      'amplitude',
      'explanation',
      'surprise',
      'coherence',
    ])
    expect(Object.keys(LIFE_CURVE_REFLECTION_LABELS)).toEqual([...LIFE_CURVE_REFLECTION_KEYS])
    Object.values(LIFE_CURVE_REFLECTION_LABELS).forEach((label) =>
      expect(label.trim()).not.toBe('')
    )
  })
})
