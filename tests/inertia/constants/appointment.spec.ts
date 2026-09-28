import { describe, expect, test } from 'vitest'
import {
  APPOINTMENTS_STATUSES,
  appointmentStatusValues,
  type AppointmentStatus,
} from '#shared/constants/appointment'
import { expectConsistentEnum } from './enum_contract.js'

describe('shared/constants/appointment', () => {
  test('enum cohérent et figé (CHECK support_appointments.status)', () => {
    expectConsistentEnum(APPOINTMENTS_STATUSES, appointmentStatusValues, [
      'scheduled',
      'completed',
      'cancelled',
      'no_show',
    ])
  })

  test('distingue les statuts terminaux du statut planifié', () => {
    const terminal: AppointmentStatus[] = [
      APPOINTMENTS_STATUSES.COMPLETED,
      APPOINTMENTS_STATUSES.CANCELLED,
      APPOINTMENTS_STATUSES.NO_SHOW,
    ]
    expect(terminal).not.toContain(APPOINTMENTS_STATUSES.SCHEDULED)
    expect(new Set([...terminal, APPOINTMENTS_STATUSES.SCHEDULED])).toEqual(
      new Set(appointmentStatusValues)
    )
  })
})
