import { describe, expect, test } from 'vitest'
import { userToAdvisorDto } from '#shared/helpers/advisor/mappers'

describe('userToAdvisorDto', () => {
  const base = { id: 3, organizationId: 7, email: 'claire@example.com', name: 'Claire' }

  test.each(['admin', 'advisor', 'expert'] as const)('conserve le rôle %s tel quel', (role) => {
    expect(userToAdvisorDto({ ...base, role, disabledAt: null } as never)).toEqual({
      ...base,
      role,
      disabledAt: null,
    })
  })

  test('expose la date de désactivation en ISO', () => {
    const disabledAt = { toISO: () => '2026-10-13T10:00:00.000+00:00' }

    expect(userToAdvisorDto({ ...base, role: 'advisor', disabledAt } as never).disabledAt).toBe(
      '2026-10-13T10:00:00.000+00:00'
    )
  })
})
