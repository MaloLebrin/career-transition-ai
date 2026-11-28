import { describe, expect, test } from 'vitest'
import {
  buildLifeCurveTimeline,
  normalizeLifeCurveEvents,
} from '#shared/helpers/exercise/life_curve_timeline'

const SIZE = { width: 220, height: 120, padLeft: 10, padRight: 10, padTop: 10, padBottom: 10 }

describe('shared/helpers/exercise/life_curve_timeline', () => {
  describe('normalizeLifeCurveEvents', () => {
    test('écarte les saisies invalides, trie par année et borne la satisfaction', () => {
      expect(
        normalizeLifeCurveEvents([
          { year: 2022, satisfaction: 12, label: ' Promotion ' },
          { year: 2020, satisfaction: -3 },
          { year: '2021', satisfaction: 5 },
          null,
          { year: 2023 },
        ])
      ).toEqual([
        { year: 2020, satisfaction: 0, label: '' },
        { year: 2022, satisfaction: 10, label: 'Promotion' },
      ])
    })

    test('une seule saisie par année : la dernière l’emporte', () => {
      expect(
        normalizeLifeCurveEvents([
          { year: 2020, satisfaction: 3, label: 'Avant' },
          { year: 2020, satisfaction: 8, label: 'Après' },
        ])
      ).toEqual([{ year: 2020, satisfaction: 8, label: 'Après' }])
    })

    test('pas un tableau : aucun événement', () => {
      expect(normalizeLifeCurveEvents(undefined)).toEqual([])
      expect(normalizeLifeCurveEvents({ year: 2020 })).toEqual([])
    })
  })

  describe('buildLifeCurveTimeline', () => {
    test('moins de deux événements : pas de frise', () => {
      expect(buildLifeCurveTimeline([], SIZE)).toBeNull()
      expect(buildLifeCurveTimeline([{ year: 2020, satisfaction: 5 }], SIZE)).toBeNull()
    })

    test('axe au niveau neutre (5/10), hauts au-dessus, bas au-dessous', () => {
      const timeline = buildLifeCurveTimeline(
        [
          { year: 2020, satisfaction: 10, label: 'Sommet' },
          { year: 2021, satisfaction: 5 },
          { year: 2022, satisfaction: 0, label: 'Creux' },
        ],
        SIZE
      )!
      // padTop 10 + moitié de la hauteur utile (100)
      expect(timeline.axisY).toBe(60)
      expect(timeline.markers.map((m) => [m.x, m.curveY, m.tone])).toEqual([
        [10, 10, 'high'],
        [110, 60, 'neutral'],
        [210, 110, 'low'],
      ])
      // Année à l'opposé de la courbe : sous l'axe pour un haut, au-dessus pour un bas
      expect(timeline.markers.map((m) => m.labelSide)).toEqual(['below', 'below', 'above'])
      expect(timeline.markers[0].label).toBe('Sommet')
      expect(timeline.markers[1].label).toBe('')
    })

    test('amplitude relative : le plus grand écart au neutre touche le bord de la frise', () => {
      const timeline = buildLifeCurveTimeline(
        [
          { year: 2020, satisfaction: 7 },
          { year: 2021, satisfaction: 4 },
          { year: 2022, satisfaction: 6 },
        ],
        SIZE
      )!
      // Écart maximal 2 (7/10) : 7 au bord haut, 4 à mi-chemin sous l'axe, 6 à mi-chemin au-dessus
      expect(timeline.markers.map((m) => m.curveY)).toEqual([10, 85, 35])
    })

    test('tous les événements au neutre : courbe plate sur l’axe, sans division par zéro', () => {
      const timeline = buildLifeCurveTimeline(
        [
          { year: 2020, satisfaction: 5 },
          { year: 2021, satisfaction: 5 },
        ],
        SIZE
      )!
      expect(timeline.markers.map((m) => m.curveY)).toEqual([60, 60])
      expect(timeline.curvePath).not.toContain('NaN')
    })

    test('la surface se referme sur l’axe, découpée au-dessus et au-dessous de l’axe', () => {
      const timeline = buildLifeCurveTimeline(
        [
          { year: 2020, satisfaction: 8 },
          { year: 2024, satisfaction: 2 },
        ],
        SIZE
      )!
      expect(timeline.curvePath.startsWith('M10,')).toBe(true)
      expect(timeline.areaPath).toBe(`${timeline.curvePath}L210,60L10,60Z`)
      expect(timeline.highClip).toEqual({ x: 0, y: 0, width: 220, height: 60 })
      expect(timeline.lowClip).toEqual({ x: 0, y: 60, width: 220, height: 60 })
    })

    test('flèche au bout de l’axe, à droite du dernier événement', () => {
      const timeline = buildLifeCurveTimeline(
        [
          { year: 2020, satisfaction: 6 },
          { year: 2021, satisfaction: 4 },
        ],
        SIZE
      )!
      expect(timeline.axisEndX).toBe(210)
      expect(timeline.arrowPath).toBe('M210,55L220,60L210,65Z')
      expect(timeline.axisStartX).toBeLessThan(timeline.markers[0].x)
    })
  })
})
