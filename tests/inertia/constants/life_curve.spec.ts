import { describe, expect, test } from 'vitest'
import {
  LIFE_CURVE_MIN_AMPLITUDE,
  LIFE_CURVE_TEXTS,
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

  test('amplitude plancher : un écart réel inférieur ne remplit pas la frise', () => {
    expect(LIFE_CURVE_MIN_AMPLITUDE).toBeGreaterThan(0)
    expect(LIFE_CURVE_MIN_AMPLITUDE).toBeLessThanOrEqual(
      LIFE_CURVE_SCALE.MAX - LIFE_CURVE_SCALE.NEUTRAL
    )
  })

  test('légende dérivée du niveau neutre de l’échelle', () => {
    expect(LIFE_CURVE_TEXTS).toEqual({
      LEGEND_HIGH: 'Hauts : au-dessus de 5/10',
      LEGEND_LOW: 'Bas : au-dessous de 5/10',
      UNLABELED_EVENT: 'Sans libellé',
    })
  })
})
