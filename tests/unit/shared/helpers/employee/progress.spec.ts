import { test } from '@japa/runner'
import { getProgress } from '#shared/helpers/employee/progress'

test.group('getProgress', () => {
  test('plan vide : 0 / 0 et 0 %', ({ assert }) => {
    assert.deepEqual(getProgress([]), { completed: 0, total: 0, percent: 0 })
  })

  test('compte les étapes terminées et arrondit le pourcentage', ({ assert }) => {
    const plan = [{ completed: true }, { completed: false }, { completed: false }]
    assert.deepEqual(getProgress(plan), { completed: 1, total: 3, percent: 33 })
  })

  test('arrondit au plus proche (2/3 → 67 %)', ({ assert }) => {
    const plan = [{ completed: true }, { completed: true }, { completed: false }]
    assert.equal(getProgress(plan).percent, 67)
  })

  test('plan terminé : 100 %', ({ assert }) => {
    assert.deepEqual(getProgress([{ completed: true }, { completed: true }]), {
      completed: 2,
      total: 2,
      percent: 100,
    })
  })
})
