import { SkillFactory } from '#database/factories/skill_factory'
import Employee from '#models/employee'
import { getSkills } from '#services/dossier_pdf_service'
import { createCandidate } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

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
