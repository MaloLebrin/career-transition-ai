import { SkillFactory } from '#database/factories/skill_factory'
import Employee from '#models/employee'
import type ExerciseResult from '#models/exercise_result'
import { getSkills, resultMetaLine } from '#services/dossier_pdf_service'
import { createCandidate } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

test.group('dossier_pdf_service — getSkills', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lit le niveau depuis le pivot employee_skills (non-régression : toujours 3)', async ({
    assert,
  }) => {
    const { employee } = await createCandidate()
    const react = await SkillFactory.merge({ organizationId: employee.organizationId }).create()
    const sql = await SkillFactory.merge({ organizationId: employee.organizationId }).create()
    await employee.related('skills').attach({ [react.id]: { level: 5 }, [sql.id]: { level: 1 } })

    const loaded = await Employee.query()
      .where('id', employee.id)
      .preload('skills', (q) => q.pivotColumns(['level']))
      .firstOrFail()

    const levels = Object.fromEntries(getSkills(loaded).map((s) => [s.name, s.level]))
    assert.deepEqual(levels, { [react.name]: 5, [sql.name]: 1 })
  })
})

test.group('resultMetaLine', () => {
  test('date et durée, jamais de score (#168)', ({ assert }) => {
    const result = {
      date: DateTime.fromISO('2026-01-15'),
      duration: 30,
      quantitativeScore: 10,
    } as unknown as ExerciseResult

    const line = resultMetaLine(result)

    assert.equal(line, '15/01/2026  ·  30 min')
    assert.notInclude(line ?? '', 'Score')
  })

  test('rien à afficher → null', ({ assert }) => {
    assert.isNull(resultMetaLine({ date: null, duration: null }))
  })
})
