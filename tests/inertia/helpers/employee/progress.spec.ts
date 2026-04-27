import { describe, expect, test } from 'vitest'
import { getProgress } from '../../../../shared/helpers/employee/progress'

describe('shared/helpers/employee/progress', () => {
  describe('getProgress', () => {
    test('retourne 0/0/0 pour un plan vide', () => {
      expect(getProgress([])).toEqual({ completed: 0, total: 0, percent: 0 })
    })

    test('retourne le bon total et 0 complété', () => {
      const plan = [{ completed: false }, { completed: false }, { completed: false }]
      expect(getProgress(plan)).toEqual({ completed: 0, total: 3, percent: 0 })
    })

    test('retourne le bon nombre de complétés', () => {
      const plan = [{ completed: true }, { completed: false }, { completed: true }]
      expect(getProgress(plan)).toEqual({ completed: 2, total: 3, percent: 67 })
    })

    test('retourne 100% quand tout est complété', () => {
      const plan = [{ completed: true }, { completed: true }]
      expect(getProgress(plan)).toEqual({ completed: 2, total: 2, percent: 100 })
    })

    test('arrondit le pourcentage au plus proche', () => {
      const plan = [{ completed: true }, { completed: false }, { completed: false }]
      expect(getProgress(plan)).toEqual({ completed: 1, total: 3, percent: 33 })
    })
  })
})
