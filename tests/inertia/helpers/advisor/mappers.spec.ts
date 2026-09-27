import { describe, expect, test } from 'vitest'
import { userToAdvisorDto } from '#shared/helpers/advisor/mappers'

describe('userToAdvisorDto', () => {
  const base = { id: 3, organizationId: 7, email: 'claire@example.com', name: 'Claire' }

  test('un admin garde le rôle admin', () => {
    expect(userToAdvisorDto({ ...base, role: 'admin' } as never)).toEqual({
      ...base,
      role: 'admin',
    })
  })

  test('tout autre rôle est exposé comme expert', () => {
    expect(userToAdvisorDto({ ...base, role: 'advisor' } as never).role).toBe('expert')
  })
})
