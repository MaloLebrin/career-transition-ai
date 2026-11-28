import {
  APP_TIME_ZONE,
  formatDate,
  formatDateTimeFR,
  formatDurationSeconds,
  formatRelativeTime,
  formatSessionDate,
} from '#shared/helpers/date'
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

  describe('fuseau d’affichage (date de passage décalée d’un jour)', () => {
    let previousTz: string | undefined
    beforeEach(() => {
      previousTz = process.env.TZ
      // Navigateur à l'ouest de Paris : minuit à Paris y est encore la veille
      process.env.TZ = 'America/Montreal'
    })
    afterEach(() => {
      process.env.TZ = previousTz
    })

    test('le fuseau de l’application est Europe/Paris', () => {
      expect(APP_TIME_ZONE).toBe('Europe/Paris')
    })

    test('formatSessionDate garde le jour d’une date sérialisée à minuit heure de Paris', () => {
      expect(formatSessionDate('2024-06-02T00:00:00.000+02:00')).toBe('2 juin 2024')
      expect(formatSessionDate('2024-01-15T00:00:00.000+01:00')).toBe('15 janvier 2024')
    })

    test('formatSessionDate garde le jour d’une date de calendrier seule', () => {
      expect(formatSessionDate('2024-03-15')).toBe('15 mars 2024')
    })

    test('formatDate garde le jour et le mois', () => {
      expect(
        formatDate('2024-06-02T00:00:00.000+02:00', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      ).toBe('2 juin 2024')
      expect(formatDate('2022-08-01', { month: 'short', year: 'numeric' })).toBe('août 2022')
    })
  })

  describe('formatDurationSeconds', () => {
    test('durée stockée en secondes, jamais lue comme des minutes', () => {
      expect(formatDurationSeconds(120)).toBe('2 min')
      expect(formatDurationSeconds(680)).toBe('11 min 20 s')
      expect(formatDurationSeconds(45)).toBe('45 s')
    })

    test('arrondit les secondes non entières', () => {
      expect(formatDurationSeconds(59.6)).toBe('1 min')
    })

    test('tiret pour une durée absente, nulle ou invalide', () => {
      expect(formatDurationSeconds(undefined)).toBe('—')
      expect(formatDurationSeconds(null)).toBe('—')
      expect(formatDurationSeconds(0)).toBe('—')
      expect(formatDurationSeconds(-5)).toBe('—')
      expect(formatDurationSeconds(Number.NaN)).toBe('—')
    })
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
