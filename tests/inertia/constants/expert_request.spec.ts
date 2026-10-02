import { describe, expect, test } from 'vitest'
import {
  EXPERT_REQUEST_MESSAGE_MAX,
  EXPERT_REQUEST_PATHS,
  EXPERT_REQUEST_STATUSES,
  EXPERT_REQUEST_STATUS_LABELS,
  EXPERT_SUPPORT_LOCK_REASONS,
  expertRequestStatusValues,
} from '#shared/constants/expert_request'
import { expectConsistentEnum } from './enum_contract.js'

describe('shared/constants/expert_request (#103)', () => {
  test('statuts : enum cohérent et figé (CHECK expert_requests.status)', () => {
    expectConsistentEnum(EXPERT_REQUEST_STATUSES, expertRequestStatusValues, [
      'pending',
      'accepted',
      'declined',
      'closed',
    ])
  })

  test('chaque statut a un libellé', () => {
    for (const status of expertRequestStatusValues) {
      expect(EXPERT_REQUEST_STATUS_LABELS[status]).toBeTruthy()
    }
  })

  test('motifs de verrou et routes', () => {
    expect(Object.values(EXPERT_SUPPORT_LOCK_REASONS)).toEqual(['b2b', 'payment'])
    expect(EXPERT_REQUEST_MESSAGE_MAX).toBe(2000)
    expect(EXPERT_REQUEST_PATHS.page).toBe('/dashboard/candidat/accompagnement')
    expect(EXPERT_REQUEST_PATHS.create).toBe('/dashboard/candidat/expert-requests')
    expect(EXPERT_REQUEST_PATHS.admin.startsWith('/dashboard/super-admin/')).toBe(true)
  })
})
