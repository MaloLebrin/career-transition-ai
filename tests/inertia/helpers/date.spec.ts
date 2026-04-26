import { formatDateTimeFR, formatRelativeTime, formatSessionDate } from '#shared/helpers/date'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

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

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-04-26T12:00:00.000Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    test('returns "À l\'instant" for less than 1 minute', () => {
      const date = new Date('2026-04-26T11:59:30.000Z').toISOString()
      expect(formatRelativeTime(date)).toBe("À l'instant")
    })

    test('returns minutes for less than 1 hour', () => {
      const date = new Date('2026-04-26T11:15:00.000Z').toISOString()
      expect(formatRelativeTime(date)).toBe('Il y a 45 min')
    })

    test('returns hours for less than 24 hours', () => {
      const date = new Date('2026-04-26T07:00:00.000Z').toISOString()
      expect(formatRelativeTime(date)).toBe('Il y a 5h')
    })

    test('returns days for 24 hours or more', () => {
      const date = new Date('2026-04-24T10:00:00.000Z').toISOString()
      expect(formatRelativeTime(date)).toBe('Il y a 2j')
    })
  })
})
