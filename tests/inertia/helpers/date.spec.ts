import { describe, expect, test } from 'vitest'
import { formatDateTimeFR, formatSessionDate } from '../../../shared/helpers/date'

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

  test('formatDateTimeFR returns — for undefined', () => {
    expect(formatDateTimeFR(undefined)).toBe('—')
  })

  test('formatDateTimeFR returns input when invalid date', () => {
    expect(formatDateTimeFR('not-a-date')).toBe('not-a-date')
  })

  test('formatDateTimeFR uses Europe/Paris for stable hour output', () => {
    expect(formatDateTimeFR('2026-03-24T12:00:00.000Z')).toContain('13:00')
  })
})
