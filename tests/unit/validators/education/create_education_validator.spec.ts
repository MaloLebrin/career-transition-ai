import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { createEducationValidator } from '#validators/education/create_education_validator'

const valid = () => ({
  degree: '  Master Informatique  ',
  school: 'Université de Nantes',
  startDate: '2018-09-01',
  endDate: '2020-06-30',
  isCurrent: false,
  description: 'Spécialité génie logiciel.',
  sortOrder: 1,
})

test.group('createEducationValidator', () => {
  test('accepte un payload complet et convertit les dates en DateTime', async ({ assert }) => {
    const result = await createEducationValidator.validate(valid())

    assert.equal(result.degree, 'Master Informatique')
    assert.equal(result.school, 'Université de Nantes')
    assert.instanceOf(result.startDate, DateTime)
    assert.equal(result.startDate.toISODate(), '2018-09-01')
    assert.instanceOf(result.endDate, DateTime)
    assert.equal(result.endDate!.toISODate(), '2020-06-30')
    assert.isFalse(result.isCurrent)
    assert.equal(result.sortOrder, 1)
  })

  test('accepte une formation en cours (endDate nulle, champs optionnels absents)', async ({
    assert,
  }) => {
    const { isCurrent, description, sortOrder, ...rest } = valid()
    const result = await createEducationValidator.validate({ ...rest, endDate: null })

    assert.isNull(result.endDate)
    assert.isUndefined(result.isCurrent)
    assert.isUndefined(result.description)
    assert.isUndefined(result.sortOrder)
  })

  test('rejette un diplôme vide', async ({ assert }) => {
    await assert.rejects(() => createEducationValidator.validate({ ...valid(), degree: '   ' }))
  })

  test('rejette une école trop longue', async ({ assert }) => {
    await assert.rejects(() =>
      createEducationValidator.validate({ ...valid(), school: 'x'.repeat(256) })
    )
  })

  test('rejette une date de début dans le futur', async ({ assert }) => {
    const future = DateTime.now().plus({ years: 1 }).toISODate()
    await assert.rejects(() =>
      createEducationValidator.validate({ ...valid(), startDate: future, endDate: null })
    )
  })

  test('rejette une date de fin antérieure à la date de début', async ({ assert }) => {
    await assert.rejects(() =>
      createEducationValidator.validate({ ...valid(), endDate: '2017-01-01' })
    )
  })

  test('rejette une endDate absente (nullable mais pas optionnelle)', async ({ assert }) => {
    const { endDate, ...rest } = valid()
    await assert.rejects(() => createEducationValidator.validate(rest))
  })

  test('rejette une description de plus de 5000 caractères', async ({ assert }) => {
    await assert.rejects(() =>
      createEducationValidator.validate({ ...valid(), description: 'x'.repeat(5001) })
    )
  })

  test('rejette un isCurrent non booléen', async ({ assert }) => {
    await assert.rejects(() =>
      createEducationValidator.validate({ ...valid(), isCurrent: 'peut-être' as any })
    )
  })
})
