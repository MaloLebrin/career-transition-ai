import { describe, test, expect } from 'vitest'
import { formatSessionDate } from '../../../shared/helpers/date'

describe('shared/helpers/date', () => {
  test('formatSessionDate returns — for undefined', () => {
    expect(formatSessionDate(undefined)).toBe('—')
  })

  test('formatSessionDate returns input when invalid date', () => {
    expect(formatSessionDate('not-a-date')).toBe('not-a-date')
  })

  test('formatSessionDate formats valid dates in French', () => {
    expect(formatSessionDate('2026-03-18T10:00:00.000Z')).toContain('2026')
  })
})

