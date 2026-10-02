import { describe, expect, test } from 'vitest'
import {
  ACCOUNT_TYPES,
  B2C_FREE_EXERCISE_TYPES,
  B2C_FREE_INCLUDES_AI_ANALYSIS,
  B2C_PUBLIC_PATHS,
  EXERCISE_LOCK_REASONS,
  accountTypeValues,
  exerciseLockReasonValues,
} from '#shared/constants/b2c'
import { EXERCISE_LIST, exerciceResultTypesValues } from '#shared/constants/exercises'
import { expectConsistentEnum } from './enum_contract.js'

describe('shared/constants/b2c (épic #90)', () => {
  test('types de compte : enum cohérent et figé (CHECK employees.account_type)', () => {
    expectConsistentEnum(ACCOUNT_TYPES, accountTypeValues, ['b2b', 'b2c'])
  })

  test('exercices gratuits : Motivations et Valeurs, dans cet ordre', () => {
    expect([...B2C_FREE_EXERCISE_TYPES]).toEqual(['motivation', 'values'])
  })

  test('chaque exercice gratuit existe et figure dans la liste affichée', () => {
    const listed = EXERCISE_LIST.map((entry) => entry.slug)
    for (const type of B2C_FREE_EXERCISE_TYPES) {
      expect(exerciceResultTypesValues).toContain(type)
      expect(listed).toContain(type)
    }
  })

  test('l’analyse IA des exercices gratuits est offerte (décision PO, question 2 de #90)', () => {
    expect(B2C_FREE_INCLUDES_AI_ANALYSIS).toBe(true)
  })

  test('motifs de verrouillage (#100) : plan (B2B) ou paiement (B2C)', () => {
    expectConsistentEnum(EXERCISE_LOCK_REASONS, exerciseLockReasonValues, ['plan', 'payment'])
  })

  test('les CTA « Débloquer » pointent vers l’offre du tableau de bord candidat', () => {
    expect(B2C_PUBLIC_PATHS.register).toBe('/inscription')
  })
})
