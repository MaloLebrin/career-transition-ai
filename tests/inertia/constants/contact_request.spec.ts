import {
  BLOCKED_CONTACT_RESPONSE_DELAY_MS,
  CONTACT_BLOCK_RETENTION_YEARS,
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

  test('le blocage d’une adresse est borné dans le temps', () => {
    expect(CONTACT_BLOCK_RETENTION_YEARS).toBeGreaterThan(0)
    expect(CONTACT_BLOCK_RETENTION_YEARS).toBeLessThanOrEqual(3)
  })

  test('l’attente d’une réponse à une adresse bloquée est un intervalle court', () => {
    expect(BLOCKED_CONTACT_RESPONSE_DELAY_MS.MIN).toBeGreaterThan(0)
    expect(BLOCKED_CONTACT_RESPONSE_DELAY_MS.MAX).toBeGreaterThan(
      BLOCKED_CONTACT_RESPONSE_DELAY_MS.MIN
    )
    expect(BLOCKED_CONTACT_RESPONSE_DELAY_MS.MAX).toBeLessThanOrEqual(2000)
  })
})
