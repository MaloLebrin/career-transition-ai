import { describe, expect, test } from 'vitest'
import { monotonePath, type PathPoint } from '#shared/helpers/exercise/monotone_path'

/** Point de départ et courbes de Bézier d'un tracé `M … C … C …`. */
function parse(d: string) {
  const numbers = (chunk: string) => chunk.split(/[ ,]+/).filter(Boolean).map(Number)
  const [move, ...curves] = d.split('C')
  const start = numbers(move.slice(1))
  return {
    start: { x: start[0], y: start[1] },
    curves: curves.map((c) => {
      const [c1x, c1y, c2x, c2y, x, y] = numbers(c)
      return { c1: { x: c1x, y: c1y }, c2: { x: c2x, y: c2y }, end: { x, y } }
    }),
  }
}

const VALLEY: PathPoint[] = [
  { x: 0, y: 40 },
  { x: 10, y: 20 },
  { x: 20, y: 80 },
  { x: 30, y: 50 },
  { x: 40, y: 50 },
]

describe('shared/helpers/exercise/monotone_path', () => {
  test('aucun point, un point, deux points : vide, simple déplacement, segment droit', () => {
    expect(monotonePath([])).toBe('')
    expect(monotonePath([{ x: 1, y: 2 }])).toBe('M1,2')
    expect(
      monotonePath([
        { x: 0, y: 10 },
        { x: 5, y: 20 },
      ])
    ).toBe('M0,10L5,20')
  })

  test('trois points ou plus : courbes de Bézier qui passent par chaque point', () => {
    const path = parse(monotonePath(VALLEY))
    expect(path.start).toEqual(VALLEY[0])
    expect(path.curves).toHaveLength(VALLEY.length - 1)
    expect(path.curves.map((c) => c.end)).toEqual(VALLEY.slice(1))
  })

  test('ne dépasse jamais un sommet ni un creux', () => {
    const path = parse(monotonePath(VALLEY))
    path.curves.forEach((curve, i) => {
      const low = Math.min(VALLEY[i].y, VALLEY[i + 1].y)
      const high = Math.max(VALLEY[i].y, VALLEY[i + 1].y)
      ;[curve.c1.y, curve.c2.y].forEach((y) => {
        expect(y).toBeGreaterThanOrEqual(low)
        expect(y).toBeLessThanOrEqual(high)
      })
    })
  })

  test('tangente horizontale sur un sommet, un creux ou un palier', () => {
    const path = parse(monotonePath(VALLEY))
    expect(path.curves[0].c2.y).toBe(20)
    expect(path.curves[1].c1.y).toBe(20)
    expect(path.curves[1].c2.y).toBe(80)
    expect(path.curves[2].c1.y).toBe(80)
    expect(path.curves[3].c1.y).toBe(50)
    expect(path.curves[3].c2.y).toBe(50)
  })

  test('deux points à la même abscisse : pas de NaN dans le tracé', () => {
    const d = monotonePath([
      { x: 0, y: 10 },
      { x: 10, y: 30 },
      { x: 10, y: 50 },
      { x: 20, y: 40 },
    ])
    expect(d).not.toContain('NaN')
    expect(d).not.toContain('Infinity')
  })
})
