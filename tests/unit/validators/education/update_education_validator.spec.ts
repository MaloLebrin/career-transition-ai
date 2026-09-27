import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { updateEducationValidator } from '#validators/education/update_education_validator'

const valid = () => ({
  id: 12,
  degree: 'Licence',
  school: 'IUT',
  startDate: '2015-09-01',
  endDate: '2018-06-30',
})

test.group('updateEducationValidator', () => {
  test("accepte un payload valide avec l'identifiant", async ({ assert }) => {
    const result = await updateEducationValidator.validate(valid())

    assert.equal(result.id, 12)
    assert.equal(result.startDate.toISODate(), '2015-09-01')
    assert.equal(result.endDate!.toISODate(), '2018-06-30')
  })

  test("rejette l'absence d'identifiant", async ({ assert }) => {
    const { id, ...rest } = valid()
    await assert.rejects(() => updateEducationValidator.validate(rest))
  })

  test('rejette un identifiant non numérique', async ({ assert }) => {
    await assert.rejects(() => updateEducationValidator.validate({ ...valid(), id: 'abc' as any }))
  })

  test('rejette une date de début future', async ({ assert }) => {
    const future = DateTime.now().plus({ days: 10 }).toISODate()
    await assert.rejects(() =>
      updateEducationValidator.validate({ ...valid(), startDate: future, endDate: null })
    )
  })

  test('rejette une date de fin avant la date de début', async ({ assert }) => {
    await assert.rejects(() =>
      updateEducationValidator.validate({ ...valid(), endDate: '2014-01-01' })
    )
  })

  test('rejette une école vide', async ({ assert }) => {
    await assert.rejects(() => updateEducationValidator.validate({ ...valid(), school: '' }))
  })
})
