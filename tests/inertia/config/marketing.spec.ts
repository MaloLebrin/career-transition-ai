import { describe, expect, test } from 'vitest'
import { PRIVACY_CONTACT_EMAIL } from '#shared/constants/legal'
import {
  CABINET_HEADER,
  CABINET_NAV,
  CABINETS_ACTION,
  CONTACT_EMAIL,
  COPYRIGHT,
  DEMO_ACTION,
  FOOTER_COLUMNS,
  INDIVIDUALS_ACTION,
  LOGIN_ACTION,
  MARKETING_NAV,
  REGISTER_ACTION,
  WAITLIST_ACTION,
} from '../../../inertia/config/marketing'

describe('config/marketing', () => {
  test('la navigation par défaut est celle du parcours particulier', () => {
    expect(MARKETING_NAV.map((item) => item.href)).toEqual([
      '/#parcours',
      '/tarifs',
      '/cabinets',
      '/qui-sommes-nous',
    ])
    expect(CABINETS_ACTION.href).toBe('/cabinets')
    expect(REGISTER_ACTION.href).toBe('/inscription')
    expect(WAITLIST_ACTION.href).toBe('/#contact')
  })

  test('la navigation cabinet pointe vers les pages cabinet et revient aux particuliers', () => {
    expect(CABINET_NAV.map((item) => item.href)).toEqual([
      '/offre',
      '/cabinets/tarifs',
      '/methodologie',
      '/',
    ])
    expect(INDIVIDUALS_ACTION.href).toBe('/')
    expect(DEMO_ACTION.href).toBe('/cabinets#demo')
    expect(CABINET_HEADER.nav).toBe(CABINET_NAV)
    expect(CABINET_HEADER.primaryAction).toBe(DEMO_ACTION)
  })

  test('actions et pied de page sont cohérents', () => {
    expect(LOGIN_ACTION.href).toBe('/auth/login')
    expect(CONTACT_EMAIL).toBe(PRIVACY_CONTACT_EMAIL)
    expect(COPYRIGHT).toContain('Transition Carrière')
    expect(FOOTER_COLUMNS.map((column) => column.title)).toEqual([
      'Particuliers',
      'Cabinets',
      'Légal',
    ])
    const hrefs = FOOTER_COLUMNS.flatMap((column) => column.links.map((link) => link.href))
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/cabinets',
        '/cabinets/tarifs',
        '/mentions-legales',
        '/confidentialite',
        '/securite',
      ])
    )
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })
})
