import {
  safeArr,
  safeNum,
  safeObj,
  SvgText,
} from '#services/employee_synthesis_pdf/charts/chart_helpers'
import { test } from '@japa/runner'

test.group('employee_synthesis_pdf/charts/chart_helpers', () => {
  test('safeNum : nombre fini, sinon la valeur de repli', ({ assert }) => {
    assert.equal(safeNum('42'), 42)
    assert.equal(safeNum(3.5), 3.5)
    assert.equal(safeNum('abc'), 0)
    assert.equal(safeNum(Number.POSITIVE_INFINITY, 7), 7)
    assert.equal(safeNum(undefined, -1), -1)
  })

  test('safeArr : tableau tel quel, sinon tableau vide', ({ assert }) => {
    assert.deepEqual(safeArr([1, 2]), [1, 2])
    assert.deepEqual(safeArr(null), [])
    assert.deepEqual(safeArr({ length: 1 }), [])
  })

  test('safeObj : objet simple tel quel, sinon objet vide', ({ assert }) => {
    assert.deepEqual(safeObj({ a: 1 }), { a: 1 })
    assert.deepEqual(safeObj([1]), {})
    assert.deepEqual(safeObj(null), {})
    assert.deepEqual(safeObj('x'), {})
  })

  test('SvgText est le composant Text SVG de react-pdf', ({ assert }) => {
    assert.isDefined(SvgText)
  })
})
