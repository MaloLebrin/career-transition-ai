import { describe, expect, test } from 'vitest'
import {
  DISC_RADAR_MIN_SPAN,
  discRadarDomain,
  discRadarRatio,
  discRadarTicks,
  discWheelPoint,
  discWheelPosition,
  discWheelRingAt,
  discWheelZoneAt,
  discWheelZoneBounds,
  polarToXY,
  sectorPath,
} from '#shared/helpers/exercise/disc_wheel_geometry'
import { DISC_WHEEL_ZONES } from '#shared/constants/disc_wheel'

describe('shared/helpers/exercise/disc_wheel_geometry', () => {
  describe('polarToXY', () => {
    test('0° est en haut, 90° à droite (sens horaire, repère SVG)', () => {
      const top = polarToXY(100, 100, 50, 0)
      const right = polarToXY(100, 100, 50, 90)
      expect(top.x).toBeCloseTo(100)
      expect(top.y).toBeCloseTo(50)
      expect(right.x).toBeCloseTo(150)
      expect(right.y).toBeCloseTo(100)
    })
  })

  describe('discWheelPosition', () => {
    test('un trait D pur place le point dans la zone Directif, au bord de la roue', () => {
      const position = discWheelPosition({ D: 100, I: 0, S: 0, C: 0 })
      expect(position.zone?.key).toBe('directif')
      expect(position.angle).toBeCloseTo(45)
      expect(position.intensity).toBeCloseTo(1)
      expect(position.ring.key).toBe('marked')
    })

    test.each([
      [{ D: 80, I: 80, S: 20, C: 20 }, 'promoteur'],
      [{ D: 20, I: 80, S: 20, C: 20 }, 'expansif'],
      [{ D: 20, I: 80, S: 80, C: 20 }, 'facilitant'],
      [{ D: 20, I: 20, S: 80, C: 20 }, 'cooperatif'],
      [{ D: 20, I: 20, S: 80, C: 80 }, 'coordonnant'],
      [{ D: 20, I: 20, S: 20, C: 80 }, 'consciencieux'],
    ])('%o → %s', (percent, zone) => {
      expect(discWheelPosition(percent).zone?.key).toBe(zone)
    })

    test('C + D égaux : zone Organisant, en passant par 360° / 0°', () => {
      const position = discWheelPosition({ D: 80, I: 20, S: 20, C: 80 })
      expect(position.zone?.key).toBe('organisant')
      expect([0, 360]).toContainEqual(Math.round(position.angle))
    })

    test('scores égaux : point au centre, aucune zone, profil équilibré', () => {
      const position = discWheelPosition({ D: 50, I: 50, S: 50, C: 50 })
      expect(position.zone).toBeNull()
      expect(position.intensity).toBe(0)
      expect(position.ring.key).toBe('balanced')
    })

    test('un écart de 10 points s’éloigne nettement du centre (racine)', () => {
      const position = discWheelPosition({ D: 55, I: 50, S: 45, C: 50 })
      expect(position.rawIntensity).toBeCloseTo(0.1)
      expect(position.intensity).toBeCloseTo(Math.sqrt(0.1))
      expect(position.ring.key).toBe('nuanced')
    })

    test('valeurs invalides ou hors bornes : traitées comme 0..100', () => {
      const position = discWheelPosition({ D: 'abc', I: 250, S: -10, C: undefined })
      expect(position.zone?.key).toBe('expansif')
      expect(position.intensity).toBeLessThanOrEqual(1)
    })
  })

  test('discWheelPoint : centre pour un profil équilibré, bord pour un trait pur', () => {
    const center = discWheelPoint(discWheelPosition({ D: 50, I: 50, S: 50, C: 50 }), 100, 100, 80)
    expect(center).toEqual({ x: 100, y: 100 })
    const edge = discWheelPoint(discWheelPosition({ D: 0, I: 0, S: 100, C: 0 }), 100, 100, 80)
    expect(Math.hypot(edge.x - 100, edge.y - 100)).toBeCloseTo(80)
  })

  test('discWheelZoneAt / discWheelZoneBounds : chaque zone couvre 45° autour de son angle', () => {
    DISC_WHEEL_ZONES.forEach((zone) => {
      const { start, end } = discWheelZoneBounds(zone)
      expect(end - start).toBe(45)
      expect(discWheelZoneAt(zone.angle + 20).key).toBe(zone.key)
      expect(discWheelZoneAt(zone.angle - 20).key).toBe(zone.key)
    })
    expect(discWheelZoneAt(-10).key).toBe('organisant')
  })

  test('discWheelRingAt : bornes et valeurs hors intervalle', () => {
    expect(discWheelRingAt(0).key).toBe('balanced')
    expect(discWheelRingAt(0.3).key).toBe('nuanced')
    expect(discWheelRingAt(0.6).key).toBe('asserted')
    expect(discWheelRingAt(1).key).toBe('marked')
    expect(discWheelRingAt(5).key).toBe('marked')
  })

  describe('sectorPath', () => {
    test('secteur d’anneau : deux arcs et un retour', () => {
      const path = sectorPath(100, 100, 20, 80, -22.5, 22.5)
      expect(path.startsWith('M ')).toBe(true)
      expect(path.match(/A /g)).toHaveLength(2)
      expect(path.endsWith('Z')).toBe(true)
    })

    test('rayon intérieur nul : part de disque fermée au centre', () => {
      const path = sectorPath(100, 100, 0, 80, 0, 45)
      expect(path.match(/A /g)).toHaveLength(1)
      expect(path).toContain('L 100 100')
    })
  })

  describe('discRadarDomain', () => {
    test('resserre l’échelle autour des scores (multiples de 10)', () => {
      expect(discRadarDomain({ D: 40, I: 62, S: 55, C: 48 })).toEqual([30, 70])
    })

    test('garde un écart minimal quand les scores sont proches', () => {
      const [low, high] = discRadarDomain({ D: 50, I: 50, S: 50, C: 50 })
      expect(high - low).toBeGreaterThanOrEqual(DISC_RADAR_MIN_SPAN)
      expect(low).toBeLessThanOrEqual(40)
      expect(high).toBeGreaterThanOrEqual(55)
    })

    test.each([
      [{ D: 100, I: 100, S: 100, C: 100 }],
      [{ D: 0, I: 0, S: 0, C: 0 }],
      [{ D: 0, I: 100, S: 50, C: 50 }],
    ])('reste dans [0, 100] : %o', (percent) => {
      const [low, high] = discRadarDomain(percent)
      expect(low).toBeGreaterThanOrEqual(0)
      expect(high).toBeLessThanOrEqual(100)
      expect(high - low).toBeGreaterThanOrEqual(DISC_RADAR_MIN_SPAN)
    })

    test('tous les scores tiennent dans le domaine', () => {
      const percent = { D: 20, I: 85, S: 75, C: 25 }
      const [low, high] = discRadarDomain(percent)
      Object.values(percent).forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(low)
        expect(value).toBeLessThanOrEqual(high)
      })
    })
  })

  test('discRadarTicks : paliers de 10, ou de 20 au-delà de 50 points', () => {
    expect(discRadarTicks([30, 70])).toEqual([30, 40, 50, 60, 70])
    expect(discRadarTicks([10, 90])).toEqual([10, 30, 50, 70, 90])
    expect(discRadarTicks([0, 70])).toEqual([0, 20, 40, 60, 70])
  })

  test('discRadarRatio : position relative bornée', () => {
    expect(discRadarRatio(50, [30, 70])).toBeCloseTo(0.5)
    expect(discRadarRatio(10, [30, 70])).toBe(0)
    expect(discRadarRatio(90, [30, 70])).toBe(1)
    expect(discRadarRatio(50, [50, 50])).toBe(0)
  })
})
