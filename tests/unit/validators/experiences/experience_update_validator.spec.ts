import { test } from '@japa/runner'
import { experienceUpdateValidator } from '#validators/experiences/experience_update_validator'
import { EXPERIENCES_TYPES } from '#shared/constants/experience'

const valid = () => ({
  id: 3,
  title: 'Chef de projet',
  company: 'Initech',
  type: EXPERIENCES_TYPES.FREELANCE,
  startDate: '2019-03-01',
  endDate: null,
  isCurrent: true,
  description: null,
})

test.group('experienceUpdateValidator', () => {
  test("accepte un payload valide avec l'identifiant", async ({ assert }) => {
    const result = await experienceUpdateValidator.validate(valid())

    assert.equal(result.id, 3)
    assert.equal(result.type, 'freelance')
    assert.equal(result.startDate.toISODate(), '2019-03-01')
    assert.isNull(result.endDate)
    assert.isTrue(result.isCurrent)
  })

  test("rejette l'absence d'identifiant", async ({ assert }) => {
    const { id, ...rest } = valid()
    await assert.rejects(() => experienceUpdateValidator.validate(rest as any))
  })

  test('rejette un type inconnu', async ({ assert }) => {
    await assert.rejects(() =>
      experienceUpdateValidator.validate({ ...valid(), type: 'benevolat' as any })
    )
  })

  test('rejette une date de fin antérieure au début', async ({ assert }) => {
    await assert.rejects(() =>
      experienceUpdateValidator.validate({ ...valid(), endDate: '2018-01-01' as any })
    )
  })
})
