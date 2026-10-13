import { SUPER_ADMIN_PATHS } from '#shared/constants/super_admin'
import { describe, expect, test } from 'vitest'

describe('SUPER_ADMIN_PATHS', () => {
  test('construit les chemins du back-office', () => {
    expect(SUPER_ADMIN_PATHS.organizations).toBe('/dashboard/super-admin/organizations')
    expect(SUPER_ADMIN_PATHS.organization(7)).toBe('/dashboard/super-admin/organizations/7')
    expect(SUPER_ADMIN_PATHS.user(3)).toBe('/dashboard/super-admin/users/3')
    expect(SUPER_ADMIN_PATHS.userDisable(3)).toBe('/dashboard/super-admin/users/3/disable')
    expect(SUPER_ADMIN_PATHS.userEnable(3)).toBe('/dashboard/super-admin/users/3/enable')
    expect(SUPER_ADMIN_PATHS.contactRequestStatus(9)).toBe(
      '/dashboard/super-admin/contact-requests/9/status'
    )
    expect(SUPER_ADMIN_PATHS.skill(4)).toBe('/dashboard/super-admin/skills/4')
  })
})
