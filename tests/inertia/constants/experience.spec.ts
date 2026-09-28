import { describe, expect, test } from 'vitest'
import { EXPERIENCES_TYPES, experiencesTypesValues } from '#shared/constants/experience'
import { expectConsistentEnum } from './enum_contract.js'

describe('shared/constants/experience', () => {
  test('enum cohérent et figé (CHECK experiences.type)', () => {
    expectConsistentEnum(EXPERIENCES_TYPES, experiencesTypesValues, [
      'cdi',
      'cdd',
      'interim',
      'freelance',
      'independent',
      'alternance',
      'other',
    ])
  })

  test('propose un type « other » de repli pour les contrats non listés', () => {
    expect(experiencesTypesValues).toContain(EXPERIENCES_TYPES.OTHER)
  })
})
