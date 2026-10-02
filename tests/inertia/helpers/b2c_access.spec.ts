import { describe, expect, test } from 'vitest'
import { ACCOUNT_TYPES, B2C_FREE_EXERCISE_TYPES } from '#shared/constants/b2c'
import { EXERCICE_RESULTS_TYPES, EXERCISE_LIST } from '#shared/constants/exercises'
import {
  canAccessExerciseB2c,
  canSeeAiAnalysisB2c,
  canSeeResultsB2c,
  isB2cAccount,
  orderExercisesForB2c,
  redactLockedExercise,
  shouldRunAiAnalysisB2c,
} from '#shared/helpers/b2c_access'
import type { ResultsEntitlement } from '#shared/types/billing/entitlement'

function entitlement(overrides: Partial<ResultsEntitlement> = {}): ResultsEntitlement {
  return {
    accountType: ACCOUNT_TYPES.B2C,
    hasPaidAccess: false,
    freeExerciseTypes: B2C_FREE_EXERCISE_TYPES,
    paymentsEnabled: true,
    ...overrides,
  }
}

const FREE = EXERCICE_RESULTS_TYPES.MOTIVATION
const PAID = EXERCICE_RESULTS_TYPES.DISC

describe('shared/helpers/b2c_access (épic #90)', () => {
  test('isB2cAccount : vrai pour b2c seulement', () => {
    expect(isB2cAccount(ACCOUNT_TYPES.B2C)).toBe(true)
    expect(isB2cAccount(ACCOUNT_TYPES.B2B)).toBe(false)
    expect(isB2cAccount(null)).toBe(false)
    expect(isB2cAccount(undefined)).toBe(false)
  })

  describe('non payé', () => {
    const unpaid = entitlement()

    test('exercice gratuit : accès, résultats et analyse IA', () => {
      expect(canAccessExerciseB2c(FREE, unpaid)).toBe(true)
      expect(canSeeResultsB2c(FREE, unpaid)).toBe(true)
      expect(canSeeAiAnalysisB2c(FREE, unpaid)).toBe(true)
    })

    test('exercice payant : tout est verrouillé', () => {
      expect(canAccessExerciseB2c(PAID, unpaid)).toBe(false)
      expect(canSeeResultsB2c(PAID, unpaid)).toBe(false)
      expect(canSeeAiAnalysisB2c(PAID, unpaid)).toBe(false)
    })

    test('analyse IA : une seule fois pour un exercice gratuit, jamais pour un verrouillé', () => {
      expect(shouldRunAiAnalysisB2c(FREE, unpaid, false)).toBe(true)
      expect(shouldRunAiAnalysisB2c(FREE, unpaid, true)).toBe(false)
      expect(shouldRunAiAnalysisB2c(PAID, unpaid, false)).toBe(false)
    })
  })

  describe('payé', () => {
    const paid = entitlement({ hasPaidAccess: true })

    test('tout exercice : accès, résultats, analyse', () => {
      for (const type of [FREE, PAID]) {
        expect(canAccessExerciseB2c(type, paid)).toBe(true)
        expect(canSeeResultsB2c(type, paid)).toBe(true)
        expect(canSeeAiAnalysisB2c(type, paid)).toBe(true)
      }
    })

    test('analyse IA relancée même si une analyse existe', () => {
      expect(shouldRunAiAnalysisB2c(PAID, paid, true)).toBe(true)
      expect(shouldRunAiAnalysisB2c(FREE, paid, true)).toBe(true)
    })
  })

  describe('orderExercisesForB2c', () => {
    test('gratuits d’abord, ordre de la liste conservé dans chaque groupe', () => {
      const shuffled = [...EXERCISE_LIST].reverse()
      const ordered = orderExercisesForB2c(shuffled, B2C_FREE_EXERCISE_TYPES)

      expect(ordered.map((e) => e.slug).slice(0, 2)).toEqual(['values', 'motivation'])
      expect(ordered.slice(2).map((e) => e.slug)).toEqual(
        shuffled
          .filter((e) => !B2C_FREE_EXERCISE_TYPES.includes(e.slug as never))
          .map((e) => e.slug)
      )
      expect(ordered).toHaveLength(EXERCISE_LIST.length)
    })

    test('ne modifie pas la liste d’origine', () => {
      const input = [...EXERCISE_LIST]
      orderExercisesForB2c(input, B2C_FREE_EXERCISE_TYPES)
      expect(input).toEqual(EXERCISE_LIST)
    })
  })

  describe('redactLockedExercise', () => {
    test('vide les réponses et l’analyse, garde le reste, marque locked', () => {
      const result = {
        id: 4,
        type: PAID,
        status: 'completed',
        progressPercent: 100,
        data: { answers: [1, 2, 3] },
        qualitativeAnalysis: 'Profil dominant',
        quantitativeScore: 42,
      }

      const redacted = redactLockedExercise(result)

      expect(redacted).toEqual({
        id: 4,
        type: PAID,
        status: 'completed',
        progressPercent: 100,
        data: {},
        qualitativeAnalysis: null,
        quantitativeScore: 0,
        locked: true,
      })
      expect(result.data).toEqual({ answers: [1, 2, 3] })
    })
  })
})
