import { backfillExerciseAnalyses } from '#database/migrations/1791000000007_add_analyzed_at_to_exercise_results'
import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import ExerciseResult from '#models/exercise_result'
import { EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'
import { createCandidate } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Migration analyzed_at — reprise des données (#168)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('chaîne vide → NULL, analyse existante → marquée analysée', async ({ assert }) => {
    const { employee } = await createCandidate()
    const empty = await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      qualitativeAnalysis: '',
    }).create()
    const analysed = await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.VALUES,
      qualitativeAnalysis: 'Analyse IA',
    }).create()
    const none = await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.DISC,
    }).create()

    await backfillExerciseAnalyses(db.connection())

    const [e, a, n] = await Promise.all(
      [empty, analysed, none].map((row) => ExerciseResult.findOrFail(row.id))
    )
    assert.isNull(e.qualitativeAnalysis)
    assert.isNull(e.analyzedAt)
    assert.equal(a.qualitativeAnalysis, 'Analyse IA')
    assert.equal(a.analyzedAt?.toMillis(), a.updatedAt.toMillis())
    assert.isNull(n.analyzedAt)
  })
})
