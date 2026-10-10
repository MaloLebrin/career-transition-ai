import { describe, expect, test } from 'vitest'
import { PRIVACY_CONTACT_EMAIL } from '#shared/constants/legal'
import {
  CABINET_HEADER,
  CABINET_MENU,
  CABINETS_ACTION,
  CABINETS_MENU,
  CONTACT_EMAIL,
  COPYRIGHT,
  DEMO_ACTION,
  FOOTER_COLUMNS,
  INDIVIDUALS_ACTION,
  INDIVIDUALS_MENU,
  LOGIN_ACTION,
  MARKETING_MENU,
  REGISTER_ACTION,
  RESOURCES_MENU,
  WAITLIST_ACTION,
} from '../../../inertia/config/marketing'
import { MARKETING_TINTS } from '../../../inertia/components/marketing/tints'

describe('config/marketing', () => {
  test('le méga-menu par défaut commence par le parcours particulier', () => {
    expect(MARKETING_MENU.map((group) => group.label)).toEqual([
      'Particuliers',
      'Cabinets',
      'Ressources',
    ])
    expect(INDIVIDUALS_MENU.items.map((item) => item.href)).toEqual(['/#parcours', '/tarifs'])
    expect(RESOURCES_MENU.items.map((item) => item.href)).toEqual([
      '/qui-sommes-nous',
      '/securite',
      '/confidentialite',
    ])
    expect(CABINETS_ACTION.href).toBe('/cabinets')
    expect(REGISTER_ACTION.href).toBe('/inscription')
    expect(WAITLIST_ACTION.href).toBe('/#contact')
  })

  test('le menu cabinet met les pages cabinet en premier, avec la démo en appel', () => {
    expect(CABINET_MENU[0]).toBe(CABINETS_MENU)
    expect(CABINETS_MENU.items.map((item) => item.href)).toEqual([
      '/cabinets',
      '/offre',
      '/methodologie',
      '/cabinets/tarifs',
    ])
    expect(CABINETS_MENU.cta).toBe(DEMO_ACTION)
    expect(INDIVIDUALS_ACTION.href).toBe('/')
    expect(DEMO_ACTION.href).toBe('/cabinets#demo')
    expect(CABINET_HEADER.menu).toBe(CABINET_MENU)
    expect(CABINET_HEADER.primaryAction).toBe(DEMO_ACTION)
  })

  test('chaque entrée a une description et une teinte connue', () => {
    for (const item of MARKETING_MENU.flatMap((group) => group.items)) {
      expect(item.description.length).toBeGreaterThan(10)
      expect(MARKETING_TINTS[item.tint]).toBeDefined()
    }
  })

  test('actions et pied de page sont cohérents', () => {
    expect(LOGIN_ACTION.href).toBe('/auth/login')
    expect(CONTACT_EMAIL).toBe(PRIVACY_CONTACT_EMAIL)
    expect(COPYRIGHT).toContain('Transition Carrière')
    expect(FOOTER_COLUMNS.map((column) => column.title)).toEqual([
      'Particuliers',
      'Cabinets',
      'Ressources',
      'Légal',
    ])
    const hrefs = FOOTER_COLUMNS.flatMap((column) => column.links.map((link) => link.href))
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/cabinets',
        '/cabinets/tarifs',
        '/cabinets#demo',
        '/mentions-legales',
        '/confidentialite',
        '/securite',
        '/cgu',
        '/cgv',
      ])
    )
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })
})
