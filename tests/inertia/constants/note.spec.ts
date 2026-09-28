import { describe, expect, test } from 'vitest'
import { NOTE_VISIBILITY, noteVisibilityValues } from '#shared/constants/note'
import { expectConsistentEnum } from './enum_contract.js'

describe('shared/constants/note', () => {
  test('enum cohérent et figé (CHECK notes.visibility)', () => {
    expectConsistentEnum(NOTE_VISIBILITY, noteVisibilityValues, ['private', 'shared'])
  })

  test('« private » (note réservée au conseiller) est distincte de « shared »', () => {
    expect(NOTE_VISIBILITY.PRIVATE).not.toBe(NOTE_VISIBILITY.SHARED)
  })
})
