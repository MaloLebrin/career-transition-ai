import { describe, expect, test } from 'vitest'
import {
  CANDIDATE_DOCUMENT_EXTENSIONS,
  CANDIDATE_DOCUMENT_MAX_SIZE,
  DOCUMENT_MIME_TYPES,
  MAX_CANDIDATE_DOCUMENTS,
  MEDIA_DELIVERY_TYPES,
  MEDIA_ENTITY_TYPES,
  MEDIA_KIND_LABELS,
  MEDIA_KINDS,
  MEDIA_RESOURCE_TYPES,
  mediaDeliveryTypeValues,
  mediaEntityTypeValues,
  mediaKindValues,
  mediaResourceTypeValues,
} from '#shared/constants/media'
import { ORGANIZATION_LOGO_EXTENSIONS } from '#shared/constants/organisation'
import { expectConsistentEnum } from './enum_contract.js'

describe('shared/constants/media', () => {
  test('enums cohérents et figés (CHECK de la table media)', () => {
    expectConsistentEnum(MEDIA_ENTITY_TYPES, mediaEntityTypeValues, ['employee'])
    expectConsistentEnum(MEDIA_KINDS, mediaKindValues, [
      'cv',
      'cover_letter',
      'certificate',
      'diploma',
      'other',
    ])
    expectConsistentEnum(MEDIA_RESOURCE_TYPES, mediaResourceTypeValues, ['image', 'raw'])
    expectConsistentEnum(MEDIA_DELIVERY_TYPES, mediaDeliveryTypeValues, ['authenticated', 'upload'])
  })

  test('chaque nature de document a un libellé français distinct', () => {
    expect(Object.keys(MEDIA_KIND_LABELS).sort()).toEqual([...mediaKindValues].sort())
    const labels = Object.values(MEDIA_KIND_LABELS)
    expect(new Set(labels).size).toBe(labels.length)
    expect(MEDIA_KIND_LABELS.cover_letter).toBe('Lettre de motivation')
  })

  test('livraison privée (authenticated) disponible pour les fichiers candidat', () => {
    expect(mediaDeliveryTypeValues[0]).toBe(MEDIA_DELIVERY_TYPES.AUTHENTICATED)
  })

  describe('documents candidat', () => {
    test('extensions uniques, minuscules, sans point', () => {
      expect(new Set(CANDIDATE_DOCUMENT_EXTENSIONS).size).toBe(CANDIDATE_DOCUMENT_EXTENSIONS.length)
      for (const extension of CANDIDATE_DOCUMENT_EXTENSIONS) {
        expect(extension).toMatch(/^[a-z]+$/)
      }
    })

    test('chaque extension acceptée a son type MIME de téléchargement, et réciproquement', () => {
      expect(Object.keys(DOCUMENT_MIME_TYPES).sort()).toEqual(
        [...CANDIDATE_DOCUMENT_EXTENSIONS].sort()
      )
      for (const mime of Object.values(DOCUMENT_MIME_TYPES)) {
        expect(mime).toMatch(/^(application|image)\/[\w.+-]+$/)
      }
    })

    test('jpg et jpeg partagent le même type MIME', () => {
      expect(DOCUMENT_MIME_TYPES.jpg).toBe(DOCUMENT_MIME_TYPES.jpeg)
      expect(DOCUMENT_MIME_TYPES.pdf).toBe('application/pdf')
    })

    test('SVG exclu (contenu actif), contrairement au logo public', () => {
      expect(CANDIDATE_DOCUMENT_EXTENSIONS).not.toContain('svg')
      expect(ORGANIZATION_LOGO_EXTENSIONS).toContain('svg')
    })

    test('limites : taille au format VineJS, quota entier positif', () => {
      expect(CANDIDATE_DOCUMENT_MAX_SIZE).toMatch(/^\d+(kb|mb)$/)
      expect(Number.isInteger(MAX_CANDIDATE_DOCUMENTS)).toBe(true)
      expect(MAX_CANDIDATE_DOCUMENTS).toBeGreaterThan(0)
    })
  })
})
