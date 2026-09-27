import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { experienceCreateValidator } from '#validators/experiences/experience_create_validator'
import { EXPERIENCES_TYPES, experiencesTypesValues } from '#shared/constants/experience'

const valid = () => ({
  title: '  Développeuse  ',
  company: 'ACME',
  type: EXPERIENCES_TYPES.CDI,
  startDate: '2020-01-01',
  endDate: '2023-12-31',
  isCurrent: false,
  description: 'Front-end React.',
})

test.group('experienceCreateValidator', () => {
  test('accepte un payload valide et convertit les dates', async ({ assert }) => {
    const result = await experienceCreateValidator.validate(valid())

    assert.equal(result.title, 'Développeuse')
    assert.equal(result.type, 'cdi')
    assert.instanceOf(result.startDate, DateTime)
    assert.equal(result.endDate!.toISODate(), '2023-12-31')
  })

  test('accepte chaque type de contrat', async ({ assert }) => {
    for (const type of experiencesTypesValues) {
      const result = await experienceCreateValidator.validate({ ...valid(), type })
      assert.equal(result.type, type)
    }
  })

  test('accepte les champs nullables à null', async ({ assert }) => {
    const result = await experienceCreateValidator.validate({
      ...valid(),
      endDate: null,
      isCurrent: null,
      description: null,
    })

    assert.isNull(result.endDate)
    assert.isNull(result.isCurrent)
    assert.isNull(result.description)
  })

  test('accepte une entreprise vide (pas de minLength)', async ({ assert }) => {
    const result = await experienceCreateValidator.validate({ ...valid(), company: '' })
    assert.equal(result.company, '')
  })

  test('rejette un type inconnu', async ({ assert }) => {
    await assert.rejects(() =>
      experienceCreateValidator.validate({ ...valid(), type: 'stage' as any })
    )
  })

  test('rejette un intitulé vide', async ({ assert }) => {
    await assert.rejects(() => experienceCreateValidator.validate({ ...valid(), title: '  ' }))
  })

  test('rejette une date de début future', async ({ assert }) => {
    const future = DateTime.now().plus({ months: 2 }).toISODate()
    await assert.rejects(() =>
      experienceCreateValidator.validate({ ...valid(), startDate: future, endDate: null })
    )
  })

  test('rejette une date de fin antérieure au début', async ({ assert }) => {
    await assert.rejects(() =>
      experienceCreateValidator.validate({ ...valid(), endDate: '2019-01-01' })
    )
  })

  test('rejette isCurrent absent (nullable mais pas optionnel)', async ({ assert }) => {
    const { isCurrent, ...rest } = valid()
    await assert.rejects(() => experienceCreateValidator.validate(rest as any))
  })

  test('rejette une description trop longue', async ({ assert }) => {
    await assert.rejects(() =>
      experienceCreateValidator.validate({ ...valid(), description: 'x'.repeat(5001) })
    )
  })
})
