import {
  isAdmin,
  isAdvisorOrAdmin,
  isConseillerDashboardRole,
  isOrganizationAdmin,
  isSuperAdmin,
  receivesNotifications,
} from '#shared/helpers/roles'
import { describe, expect, test } from 'vitest'

describe('role helpers (inertia)', () => {
  test('isSuperAdmin only for super_admin', () => {
    expect(isSuperAdmin('super_admin')).toBe(true)
    expect(isSuperAdmin('admin')).toBe(false)
    expect(isSuperAdmin('advisor')).toBe(false)
    expect(isSuperAdmin('employee')).toBe(false)
    expect(isSuperAdmin(undefined)).toBe(false)
    expect(isSuperAdmin(null)).toBe(false)
  })

  test('isOrganizationAdmin only for admin', () => {
    expect(isOrganizationAdmin('admin')).toBe(true)
    expect(isOrganizationAdmin('super_admin')).toBe(false)
    expect(isOrganizationAdmin('advisor')).toBe(false)
    expect(isOrganizationAdmin('employee')).toBe(false)
    expect(isOrganizationAdmin(undefined)).toBe(false)
    expect(isOrganizationAdmin(null)).toBe(false)
  })

  test('isAdmin for admin and super_admin', () => {
    expect(isAdmin('admin')).toBe(true)
    expect(isAdmin('super_admin')).toBe(true)
    expect(isAdmin('advisor')).toBe(false)
    expect(isAdmin('employee')).toBe(false)
    expect(isAdmin(undefined)).toBe(false)
    expect(isAdmin(null)).toBe(false)
  })

  test('isAdvisorOrAdmin for advisor, admin and super_admin', () => {
    expect(isAdvisorOrAdmin('advisor')).toBe(true)
    expect(isAdvisorOrAdmin('admin')).toBe(true)
    expect(isAdvisorOrAdmin('super_admin')).toBe(true)
    expect(isAdvisorOrAdmin('employee')).toBe(false)
    expect(isAdvisorOrAdmin(undefined)).toBe(false)
    expect(isAdvisorOrAdmin(null)).toBe(false)
  })

  test('isConseillerDashboardRole for advisor, admin and expert only', () => {
    expect(isConseillerDashboardRole('advisor')).toBe(true)
    expect(isConseillerDashboardRole('admin')).toBe(true)
    expect(isConseillerDashboardRole('expert')).toBe(true)
    expect(isConseillerDashboardRole('super_admin')).toBe(false)
    expect(isConseillerDashboardRole('employee')).toBe(false)
    expect(isConseillerDashboardRole(undefined)).toBe(false)
    expect(isConseillerDashboardRole(null)).toBe(false)
  })

  test('receivesNotifications: advisor, admin, super_admin and candidates (bell and routes)', () => {
    expect(receivesNotifications('advisor')).toBe(true)
    expect(receivesNotifications('admin')).toBe(true)
    expect(receivesNotifications('super_admin')).toBe(true)
    expect(receivesNotifications('employee')).toBe(true)
    expect(receivesNotifications('expert')).toBe(false)
    expect(receivesNotifications(undefined)).toBe(false)
    expect(receivesNotifications(null)).toBe(false)
  })
})
