import { describe, expect, test } from 'vitest'
import { PRIVACY_CONTACT_EMAIL } from '#shared/constants/legal'
import {
  CONTACT_EMAIL,
  COPYRIGHT,
  DEMO_ACTION,
  FOOTER_COLUMNS,
  INDIVIDUALS_ACTION,
  LOGIN_ACTION,
  MARKETING_NAV,
} from '../../../inertia/config/marketing'

describe('config/marketing', () => {
  test('navigation points to the four marketing pages (particuliers inclus, #99)', () => {
    expect(MARKETING_NAV.map((item) => item.href)).toEqual([
      '/offre',
      '/tarifs',
      '/particuliers',
      '/methodologie',
    ])
    expect(INDIVIDUALS_ACTION.href).toBe('/particuliers')
  })

  test('actions and footer are consistent', () => {
    expect(LOGIN_ACTION.href).toBe('/auth/login')
    expect(DEMO_ACTION.href).toBe('/#demo')
    expect(CONTACT_EMAIL).toBe(PRIVACY_CONTACT_EMAIL)
    expect(COPYRIGHT).toContain('Transition Carrière')
    const hrefs = FOOTER_COLUMNS.flatMap((column) => column.links.map((link) => link.href))
    expect(hrefs).toEqual(
      expect.arrayContaining(['/mentions-legales', '/confidentialite', '/securite'])
    )
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })
})
