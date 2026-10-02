import {
  normalizeExerciseType,
  redactEmployeePayload,
  redactExerciseResult,
  redactExerciseResults,
} from '#mappers/results_access_mapper'
import type { ExerciseAccess } from '#shared/types/exercise/access'
import { test } from '@japa/runner'

const b2b: ExerciseAccess = {
  accountType: 'b2b',
  unlockedExerciseSlugs: ['motivation'],
  lockedReason: 'plan',
  hasPaidAccess: true,
  freeExerciseTypes: [],
  paymentsEnabled: false,
}

const b2cUnpaid: ExerciseAccess = {
  accountType: 'b2c',
  unlockedExerciseSlugs: ['motivation', 'values'],
  lockedReason: 'payment',
  hasPaidAccess: false,
  freeExerciseTypes: ['motivation', 'values'],
  paymentsEnabled: false,
}

const b2cPaid: ExerciseAccess = { ...b2cUnpaid, hasPaidAccess: true }

/** Forme `EmployeeTransformer` (slug, `null`) et forme `mapEmployee` (majuscules, `undefined`). */
const serialized = {
  id: 1,
  type: 'disc',
  status: 'completed',
  data: { profile: 'D', answers: [1, 2, 3] },
  quantitativeScore: 42,
  qualitativeAnalysis: 'Analyse secrète',
}
const mapped = {
  id: 2,
  type: 'DISC',
  date: '2026-01-01T00:00:00.000Z',
  duration: 10,
  data: { profile: 'D' },
  quantitativeScore: 42,
  qualitativeAnalysis: 'Analyse secrète',
}

test.group('results_access_mapper (#101)', () => {
  test('normalise le type (slug ou majuscules), null si inconnu', ({ assert }) => {
    assert.equal(normalizeExerciseType('DISC'), 'disc')
    assert.equal(normalizeExerciseType('life_curve'), 'life_curve')
    assert.equal(normalizeExerciseType('LIFE_CURVE'), 'life_curve')
    assert.isNull(normalizeExerciseType('inconnu'))
  })

  test('B2B : jamais expurgé, même hors plan', ({ assert }) => {
    assert.deepEqual(redactExerciseResult(serialized, b2b), serialized)
    assert.deepEqual(redactExerciseResult(mapped, b2b), mapped)
  })

  test('B2C non payé : exercice du forfait vidé, sans analyse, marqué locked', ({ assert }) => {
    const redacted = redactExerciseResult(serialized, b2cUnpaid)

    assert.deepEqual(redacted.data, {})
    assert.equal(redacted.quantitativeScore, 0)
    assert.notProperty(redacted, 'qualitativeAnalysis')
    assert.isTrue(redacted.locked)
    assert.equal(redacted.id, 1)
    assert.equal(redacted.type, 'disc')
    assert.equal((redacted as { status: string }).status, 'completed')
    assert.notInclude(JSON.stringify(redacted), 'secrète')
    assert.notInclude(JSON.stringify(redacted), 'answers')
  })

  test('B2C non payé : la forme mapEmployee est expurgée de la même façon', ({ assert }) => {
    const redacted = redactExerciseResult(mapped, b2cUnpaid)

    assert.deepEqual(redacted.data, {})
    assert.isTrue(redacted.locked)
    assert.notProperty(redacted, 'qualitativeAnalysis')
    assert.equal(redacted.type, 'DISC')
  })

  test('B2C non payé : exercice gratuit intact (analyse incluse)', ({ assert }) => {
    const free = { ...serialized, type: 'motivation' }
    assert.deepEqual(redactExerciseResult(free, b2cUnpaid), free)
  })

  test('B2C payé : rien n’est expurgé', ({ assert }) => {
    assert.deepEqual(redactExerciseResult(serialized, b2cPaid), serialized)
  })

  test('type inconnu : traité comme payant', ({ assert }) => {
    const odd = { ...serialized, type: 'mystere' }
    assert.isTrue(redactExerciseResult(odd, b2cUnpaid).locked)
    assert.isUndefined(redactExerciseResult(odd, b2b).locked)
  })

  test('redactExerciseResults tolère null et garde l’ordre', ({ assert }) => {
    assert.deepEqual(redactExerciseResults(null, b2cUnpaid), [])
    const list = redactExerciseResults(
      [serialized, { ...serialized, id: 3, type: 'values' }],
      b2cUnpaid
    )
    assert.isTrue(list[0].locked)
    assert.isUndefined(list[1].locked)
    assert.equal(list[1].qualitativeAnalysis, 'Analyse secrète')
  })

  test('redactEmployeePayload ne touche qu’aux exercices', ({ assert }) => {
    const payload = { id: 7, name: 'Camille', exercises: [serialized], plan: [{ id: 1 }] }

    const redacted = redactEmployeePayload(payload, b2cUnpaid)

    assert.equal(redacted.name, 'Camille')
    assert.deepEqual(redacted.plan, [{ id: 1 }])
    assert.isTrue(redacted.exercises[0].locked)
    assert.deepEqual(redactEmployeePayload(payload, b2b), payload)
    assert.deepEqual(redactEmployeePayload({ id: 1 }, b2cUnpaid), { id: 1 })
    assert.isNull(redactEmployeePayload(null, b2cUnpaid))
  })
})
