import { monotonePath, type PathPoint } from '#services/employee_synthesis_pdf/charts/monotone_path'
import { test } from '@japa/runner'

/** Points de passage et points de contrôle d'un tracé `M … C … C …`. */
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

test.group('PDF de synthèse — monotonePath (courbe de vie lissée)', () => {
  test('aucun point, un point, deux points : vide, simple déplacement, segment droit', ({
    assert,
  }) => {
    assert.equal(monotonePath([]), '')
    assert.equal(monotonePath([{ x: 1, y: 2 }]), 'M1,2')
    assert.equal(
      monotonePath([
        { x: 0, y: 10 },
        { x: 5, y: 20 },
      ]),
      'M0,10L5,20'
    )
  })

  test('trois points ou plus : courbes de Bézier qui passent par chaque point', ({ assert }) => {
    const path = parse(monotonePath(VALLEY))
    assert.deepEqual(path.start, VALLEY[0])
    assert.lengthOf(path.curves, VALLEY.length - 1)
    assert.deepEqual(
      path.curves.map((c) => c.end),
      VALLEY.slice(1)
    )
  })

  test('ne dépasse jamais un sommet ni un creux (pas d’oscillation hors de l’échelle)', ({
    assert,
  }) => {
    const path = parse(monotonePath(VALLEY))
    path.curves.forEach((curve, i) => {
      const low = Math.min(VALLEY[i].y, VALLEY[i + 1].y)
      const high = Math.max(VALLEY[i].y, VALLEY[i + 1].y)
      ;[curve.c1.y, curve.c2.y].forEach((y) => {
        assert.isAtLeast(y, low)
        assert.isAtMost(y, high)
      })
    })
  })

  test('tangente horizontale sur un sommet, un creux ou un palier', ({ assert }) => {
    const path = parse(monotonePath(VALLEY))
    // Creux en x=10 (y=20), sommet en x=20 (y=80), palier entre x=30 et x=40
    assert.equal(path.curves[0].c2.y, 20)
    assert.equal(path.curves[1].c1.y, 20)
    assert.equal(path.curves[1].c2.y, 80)
    assert.equal(path.curves[2].c1.y, 80)
    assert.equal(path.curves[3].c1.y, 50)
    assert.equal(path.curves[3].c2.y, 50)
  })

  test('deux points à la même abscisse : pas de NaN dans le tracé', ({ assert }) => {
    const d = monotonePath([
      { x: 0, y: 10 },
      { x: 10, y: 30 },
      { x: 10, y: 50 },
      { x: 20, y: 40 },
    ])
    assert.notInclude(d, 'NaN')
    assert.notInclude(d, 'Infinity')
  })
})
