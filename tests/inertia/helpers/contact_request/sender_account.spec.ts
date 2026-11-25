import {
  canDisableSenderAccount,
  isSenderAccountInScope,
  normalizeContactEmail,
} from '#shared/helpers/contact_request/sender_account'
import { describe, expect, test } from 'vitest'

const PLATFORM = 1
const CLIENT = 2

describe('normalizeContactEmail', () => {
  test('retire les espaces et met en minuscules', () => {
    expect(normalizeContactEmail('  Jeanne.Martin@Example.COM ')).toBe('jeanne.martin@example.com')
  })
})

describe('isSenderAccountInScope', () => {
  test('comptes des organisations clientes : toujours à portée', () => {
    expect(
      isSenderAccountInScope(PLATFORM, { id: 5, role: 'advisor', organizationId: CLIENT })
    ).toBe(true)
    expect(isSenderAccountInScope(PLATFORM, { id: 5, role: 'admin', organizationId: CLIENT })).toBe(
      true
    )
  })

  test('organisation plateforme : les candidats seulement, pas l’équipe', () => {
    expect(
      isSenderAccountInScope(PLATFORM, { id: 5, role: 'employee', organizationId: PLATFORM })
    ).toBe(true)
    expect(
      isSenderAccountInScope(PLATFORM, { id: 5, role: 'advisor', organizationId: PLATFORM })
    ).toBe(false)
    expect(
      isSenderAccountInScope(PLATFORM, { id: 5, role: 'admin', organizationId: PLATFORM })
    ).toBe(false)
  })
})

describe('canDisableSenderAccount', () => {
  test('un compte à portée peut être désactivé', () => {
    expect(
      canDisableSenderAccount(9, PLATFORM, { id: 5, role: 'employee', organizationId: PLATFORM })
    ).toBe(true)
  })

  test('ni soi-même, ni un super admin, ni l’équipe plateforme', () => {
    expect(
      canDisableSenderAccount(5, PLATFORM, { id: 5, role: 'advisor', organizationId: CLIENT })
    ).toBe(false)
    expect(
      canDisableSenderAccount(9, PLATFORM, { id: 5, role: 'super_admin', organizationId: CLIENT })
    ).toBe(false)
    expect(
      canDisableSenderAccount(9, PLATFORM, { id: 5, role: 'expert', organizationId: PLATFORM })
    ).toBe(false)
  })
})
