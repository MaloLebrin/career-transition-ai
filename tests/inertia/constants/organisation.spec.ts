import { describe, expect, test } from 'vitest'
import {
  MAX_LICENSES_ADVISORS,
  MAX_LICENSES_CANDIDATES,
  ORGANIZATION_LOGO_EXTENSIONS,
  ORGANIZATION_LOGO_MAX_SIZE,
  ORGANIZATION_LOGO_ROUTE,
} from '#shared/constants/organisation'

describe('shared/constants/organisation', () => {
  test('quotas de licences : entiers positifs, plus de candidats que de conseillers', () => {
    for (const quota of [MAX_LICENSES_CANDIDATES, MAX_LICENSES_ADVISORS]) {
      expect(Number.isInteger(quota)).toBe(true)
      expect(quota).toBeGreaterThan(0)
    }
    expect(MAX_LICENSES_CANDIDATES).toBeGreaterThan(MAX_LICENSES_ADVISORS)
  })

  test('extensions de logo : images uniquement, minuscules, sans point ni doublon', () => {
    expect(new Set(ORGANIZATION_LOGO_EXTENSIONS).size).toBe(ORGANIZATION_LOGO_EXTENSIONS.length)
    for (const extension of ORGANIZATION_LOGO_EXTENSIONS) {
      expect(extension).toMatch(/^[a-z]+$/)
    }
    expect(ORGANIZATION_LOGO_EXTENSIONS).toEqual(expect.arrayContaining(['png', 'jpg', 'svg']))
    expect(ORGANIZATION_LOGO_EXTENSIONS).not.toContain('pdf')
  })

  test('taille max au format attendu par le validateur VineJS (ex. « 2mb »)', () => {
    expect(ORGANIZATION_LOGO_MAX_SIZE).toMatch(/^\d+(kb|mb)$/)
  })

  test('route du logo sous l’espace réglages conseiller', () => {
    expect(ORGANIZATION_LOGO_ROUTE).toMatch(/^\/dashboard\/conseiller\/settings\//)
    expect(ORGANIZATION_LOGO_ROUTE.endsWith('/logo')).toBe(true)
    expect(ORGANIZATION_LOGO_ROUTE).not.toMatch(/\/$/)
  })
})
