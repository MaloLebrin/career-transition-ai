import { describe, expect, test } from 'vitest'
import {
  ROLE_DESCRIPTIONS,
  ROLE_FILTER_ALL_DESCRIPTION,
  SUPER_ADMIN_ASSIGNABLE_ROLES,
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

  test('rôles attribuables par le super admin : tous sauf super_admin', () => {
    expect([...SUPER_ADMIN_ASSIGNABLE_ROLES].sort()).toEqual(
      userRolesValues.filter((r) => r !== USERS_ROLES.SUPER_ADMIN).sort()
    )
  })
})
