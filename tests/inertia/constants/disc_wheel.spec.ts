import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import {
  DISC_TRAIT_PALETTE,
  DISC_WHEEL_RING_KEYS,
  DISC_WHEEL_RINGS,
  DISC_WHEEL_TRAIT_ANGLES,
  DISC_WHEEL_TRAIT_LABELS,
  DISC_WHEEL_TRAITS,
  DISC_WHEEL_ZONE_KEYS,
  DISC_WHEEL_ZONE_SPAN,
  DISC_WHEEL_ZONES,
} from '#shared/constants/disc_wheel'

const appCss = readFileSync(resolve(process.cwd(), 'inertia/css/app.css'), 'utf8')

/** Résout `--color-x`, en suivant un éventuel `var(--color-y)`. */
function cssColor(name: string): string | undefined {
  const match = appCss.match(new RegExp(`--color-${name}:\\s*([^;]+);`))
  if (!match) return undefined
  const value = match[1].trim()
  const alias = value.match(/^var\(--color-([\w-]+)\)$/)
  return alias ? cssColor(alias[1]) : value.toLowerCase()
}

describe('shared/constants/disc_wheel', () => {
  test('huit zones, une par clé, centrées tous les 45°', () => {
    expect(DISC_WHEEL_ZONES).toHaveLength(8)
    expect(DISC_WHEEL_ZONES.map((zone) => zone.key).sort()).toEqual(
      Object.values(DISC_WHEEL_ZONE_KEYS).sort()
    )
    expect(DISC_WHEEL_ZONES.map((zone) => zone.angle)).toEqual(
      Array.from({ length: 8 }, (_, index) => index * DISC_WHEEL_ZONE_SPAN)
    )
  })

  test('chaque trait a sa zone pure à son angle', () => {
    DISC_WHEEL_TRAITS.forEach((trait) => {
      const zone = DISC_WHEEL_ZONES.find((z) => z.angle === DISC_WHEEL_TRAIT_ANGLES[trait])
      expect(zone?.traits).toEqual([trait])
      expect(DISC_WHEEL_TRAIT_LABELS[trait]).toBeTruthy()
    })
  })

  test('les zones mixtes associent les deux traits voisins', () => {
    DISC_WHEEL_ZONES.filter((zone) => zone.traits.length === 2).forEach((zone) => {
      const [first, second] = zone.traits as readonly [string, string]
      expect(DISC_WHEEL_TRAIT_ANGLES[first as 'D']).toBe((zone.angle - 45 + 360) % 360)
      expect(DISC_WHEEL_TRAIT_ANGLES[second as 'D']).toBe((zone.angle + 45) % 360)
    })
  })

  test('chaque zone a une description et trois mots-clés', () => {
    DISC_WHEEL_ZONES.forEach((zone) => {
      expect(zone.description.length).toBeGreaterThan(20)
      expect(zone.keywords).toHaveLength(3)
    })
  })

  test('les anneaux couvrent [0, 1] sans trou', () => {
    expect(DISC_WHEEL_RINGS.map((ring) => ring.key)).toEqual(Object.values(DISC_WHEEL_RING_KEYS))
    expect(DISC_WHEEL_RINGS[0].from).toBe(0)
    expect(DISC_WHEEL_RINGS[DISC_WHEEL_RINGS.length - 1].to).toBe(1)
    DISC_WHEEL_RINGS.slice(1).forEach((ring, index) => {
      expect(ring.from).toBe(DISC_WHEEL_RINGS[index].to)
    })
  })

  test.each(DISC_WHEEL_TRAITS)('palette %s : hex identiques aux tokens de app.css', (trait) => {
    const palette = DISC_TRAIT_PALETTE[trait]
    expect(palette.boldHex).toBe(cssColor(`tint-${palette.tint}-bold`))
    expect(palette.softHex).toBe(cssColor(`tint-${palette.tint}`))
    expect(palette.inkHex).toBe(cssColor(`tint-${palette.tint}-ink`))
    expect(palette.fillClass).toBe(`fill-tint-${palette.tint}-bold`)
    expect(palette.textClass).toBe(`text-tint-${palette.tint}-ink`)
  })
})
