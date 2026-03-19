import { describe, test, expect } from 'vitest'
import { getExerciseTitle } from '../../../shared/helpers/exercises'

describe('shared/helpers/exercises', () => {
  test('getExerciseTitle returns mapped title for known slug', () => {
    expect(getExerciseTitle('motivation')).toBe('Analyse Motivations')
    expect(getExerciseTitle('MOTIVATION')).toBe('Analyse Motivations')
  })

  test('getExerciseTitle falls back for unknown type', () => {
    expect(getExerciseTitle('unknown_type')).toBe('unknown_type')
  })
})

