import { describe, test, expect } from 'vitest'
import { isAdmin, isAdvisorOrAdmin } from '../../../inertia/helpers/roles'

describe('isAdmin', () => {
  test('returns true for admin', () => {
    expect(isAdmin('admin')).toBe(true)
  })

  test('returns true for super_admin', () => {
    expect(isAdmin('super_admin')).toBe(true)
  })

  test('returns false for advisor', () => {
    expect(isAdmin('advisor')).toBe(false)
  })

  test('returns false for employee', () => {
    expect(isAdmin('employee')).toBe(false)
  })

  test('returns false for undefined and null', () => {
    expect(isAdmin(undefined)).toBe(false)
    expect(isAdmin(null)).toBe(false)
  })
})

describe('isAdvisorOrAdmin', () => {
  test('returns true for advisor', () => {
    expect(isAdvisorOrAdmin('advisor')).toBe(true)
  })

  test('returns true for admin', () => {
    expect(isAdvisorOrAdmin('admin')).toBe(true)
  })

  test('returns true for super_admin', () => {
    expect(isAdvisorOrAdmin('super_admin')).toBe(true)
  })

  test('returns false for employee', () => {
    expect(isAdvisorOrAdmin('employee')).toBe(false)
  })

  test('returns false for undefined and null', () => {
    expect(isAdvisorOrAdmin(undefined)).toBe(false)
    expect(isAdvisorOrAdmin(null)).toBe(false)
  })
})
