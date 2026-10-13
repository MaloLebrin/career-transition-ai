import {
  CONTACT_REQUEST_STATUSES,
  CONTACT_REQUEST_STATUS_LABELS,
  CONTACT_REQUEST_TYPES,
  CONTACT_REQUEST_TYPE_LABELS,
} from '#shared/constants/contact_request'
import { describe, expect, test } from 'vitest'

describe('constantes des demandes de contact', () => {
  test('chaque statut et chaque type a un libellé', () => {
    for (const status of Object.values(CONTACT_REQUEST_STATUSES)) {
      expect(CONTACT_REQUEST_STATUS_LABELS[status]).toBeTruthy()
    }
    for (const type of Object.values(CONTACT_REQUEST_TYPES)) {
      expect(CONTACT_REQUEST_TYPE_LABELS[type]).toBeTruthy()
    }
  })
})
