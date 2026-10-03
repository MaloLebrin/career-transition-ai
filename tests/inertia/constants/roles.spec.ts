import { describe, expect, test } from 'vitest'
import {
  ROLE_DESCRIPTIONS,
  PLATFORM_TEAM_ROLES,
  ROLE_FILTER_ALL_DESCRIPTION,
  SUPER_ADMIN_CREATABLE_ROLES,
} from '#shared/constants/roles'
import { USERS_ROLES, userRolesValues } from '#shared/types/advisor/roles'
import { expectConsistentEnum } from './enum_contract.js'

describe('shared/constants/roles', () => {
  test('rôles : enum cohérent et figé (CHECK users.role)', () => {
    expectConsistentEnum(USERS_ROLES, userRolesValues, [
      'advisor',
      'employee',
      'admin',
      'expert',
      'super_admin',
    ])
  })

  test('chaque rôle a exactement une description', () => {
    expect(Object.keys(ROLE_DESCRIPTIONS).sort()).toEqual([...userRolesValues].sort())
  })

  test('descriptions non vides, distinctes et terminées par un point', () => {
    const descriptions = Object.values(ROLE_DESCRIPTIONS)
    expect(new Set(descriptions).size).toBe(descriptions.length)
    for (const description of [...descriptions, ROLE_FILTER_ALL_DESCRIPTION]) {
      expect(description.trim().length).toBeGreaterThan(10)
      expect(description.endsWith('.')).toBe(true)
    }
  })

  test('la description du super admin évoque l’administration globale', () => {
    expect(ROLE_DESCRIPTIONS[USERS_ROLES.SUPER_ADMIN]).toMatch(/globale/)
    expect(ROLE_DESCRIPTIONS[USERS_ROLES.ADMIN]).toMatch(/organisation/)
  })

  test('rôles créables par le super admin : ni super_admin (#66) ni employee (#96)', () => {
    expect([...SUPER_ADMIN_CREATABLE_ROLES]).toEqual(['advisor', 'admin', 'expert'])
    expect(SUPER_ADMIN_CREATABLE_ROLES).not.toContain(USERS_ROLES.EMPLOYEE)
    expect(SUPER_ADMIN_CREATABLE_ROLES).not.toContain(USERS_ROLES.SUPER_ADMIN)
  })

  test('équipe interne (#105) : advisor en tête, jamais employee ni super_admin', () => {
    expect([...PLATFORM_TEAM_ROLES]).toEqual(['advisor', 'expert', 'admin'])
    expect(PLATFORM_TEAM_ROLES).not.toContain('employee')
    expect(PLATFORM_TEAM_ROLES).not.toContain('super_admin')
  })
})
