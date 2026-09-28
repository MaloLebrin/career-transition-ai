import { describe, expect, test } from 'vitest'
import { FILES_TYPES, filesTypesValues } from '#shared/constants/file'
import { MEDIA_KINDS, mediaKindValues } from '#shared/constants/media'
import { expectConsistentEnum } from './enum_contract.js'

describe('shared/constants/file (historique, table `files` supprimée)', () => {
  test('enum figé : importé par des migrations déjà jouées', () => {
    expectConsistentEnum(FILES_TYPES, filesTypesValues, [
      'cv',
      'cover_letter',
      'certificate',
      'diploma',
      'other',
    ])
  })

  test('chaque ancien type a son équivalent dans MEDIA_KINDS (reprise des documents)', () => {
    for (const [key, value] of Object.entries(FILES_TYPES)) {
      expect(MEDIA_KINDS[key as keyof typeof MEDIA_KINDS]).toBe(value)
    }
    expect([...filesTypesValues]).toEqual([...mediaKindValues])
  })
})
