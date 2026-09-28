import { describe, expect, test } from 'vitest'
import {
  EMPLOYEE_STATUS_TRANSLATIONS,
  EMPLOYEES_STATUS,
  employeeStatusValues,
} from '#shared/constants/employee'
import { expectConsistentEnum } from './enum_contract.js'

describe('shared/constants/employee', () => {
  test('enum cohérent et figé (CHECK employees.status)', () => {
    expectConsistentEnum(EMPLOYEES_STATUS, employeeStatusValues, [
      'active',
      'completed',
      'on-hold',
      'archived',
      'onboarding',
    ])
  })

  test('chaque statut a exactement une traduction, non vide', () => {
    expect(Object.keys(EMPLOYEE_STATUS_TRANSLATIONS).sort()).toEqual(
      [...employeeStatusValues].sort()
    )
    for (const label of Object.values(EMPLOYEE_STATUS_TRANSLATIONS)) {
      expect(label.trim()).not.toBe('')
    }
  })

  test('les libellés sont distincts et en français', () => {
    const labels = Object.values(EMPLOYEE_STATUS_TRANSLATIONS)
    expect(new Set(labels).size).toBe(labels.length)
    expect(EMPLOYEE_STATUS_TRANSLATIONS[EMPLOYEES_STATUS.ON_HOLD]).toBe('En pause')
    expect(EMPLOYEE_STATUS_TRANSLATIONS[EMPLOYEES_STATUS.ARCHIVED]).toBe('Archivé')
  })
})
