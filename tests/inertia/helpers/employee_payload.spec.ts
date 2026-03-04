import { describe, test, expect } from 'vitest'
import { employeeUpdatePayload } from '../../../inertia/helpers/employee_payload.js'

describe('employeeUpdatePayload', () => {
  test('returns empty object for empty input', () => {
    expect(employeeUpdatePayload({})).toEqual({})
  })

  test('includes only defined scalar fields', () => {
    const result = employeeUpdatePayload({
      name: 'Jean Dupont',
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: 'Summary',
      advisorNotes: 'Notes',
      status: 'active',
      onboarded: true,
      nextAppointment: '2025-06-01',
    })
    expect(result).toEqual({
      name: 'Jean Dupont',
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: 'Summary',
      advisorNotes: 'Notes',
      status: 'active',
      onboarded: true,
      nextAppointment: '2025-06-01',
    })
  })

  test('omits undefined and nested fields', () => {
    const result = employeeUpdatePayload({
      name: 'Jane',
      email: 'jane@example.com',
      skills: [{ name: 'React', level: 4 }],
      experiences: [],
    } as any)
    expect(result).toEqual({ name: 'Jane' })
    expect(result).not.toHaveProperty('email')
    expect(result).not.toHaveProperty('skills')
    expect(result).not.toHaveProperty('experiences')
  })

  test('handles partial employee from onboarding', () => {
    const result = employeeUpdatePayload({
      name: 'Alice',
      currentRole: 'Dev',
      targetRole: 'Tech Lead',
      onboarded: true,
      status: 'active',
    })
    expect(result.name).toBe('Alice')
    expect(result.onboarded).toBe(true)
    expect(result.status).toBe('active')
  })
})
