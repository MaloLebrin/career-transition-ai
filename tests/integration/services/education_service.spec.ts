import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Education from '#models/education'
import { EducationService } from '#services/education_service'
import { createCandidate } from '#tests/support/actors'

function payload(employeeId: number) {
  return {
    employeeId,
    degree: 'Master RH',
    school: 'IAE',
    startDate: DateTime.fromISO('2016-09-01'),
    endDate: DateTime.fromISO('2018-06-30'),
    isCurrent: false,
    description: 'Alternance',
  }
}

test.group('EducationService', () => {
  test('create persiste la formation rattachée au candidat', async ({ assert }) => {
    const { employee } = await createCandidate()

    const education = await new EducationService().create(payload(employee.id))

    const stored = await Education.findOrFail(education.id)
    assert.equal(stored.employeeId, employee.id)
    assert.equal(stored.degree, 'Master RH')
    assert.equal(stored.startDate.toISODate(), '2016-09-01')
    assert.equal(stored.endDate!.toISODate(), '2018-06-30')
    assert.isFalse(stored.isCurrent)
  })

  test('update fusionne les champs et conserve le rattachement', async ({ assert }) => {
    const { employee } = await createCandidate()
    const service = new EducationService()
    const created = await service.create(payload(employee.id))

    const { employeeId, ...rest } = payload(employee.id)
    const updated = await service.update(employee.id, created.id, {
      ...rest,
      degree: 'Doctorat',
      endDate: null,
      isCurrent: true,
    })

    assert.equal(updated.id, created.id)
    const stored = await Education.findOrFail(created.id)
    assert.equal(stored.degree, 'Doctorat')
    assert.isNull(stored.endDate)
    assert.isTrue(stored.isCurrent)
    assert.equal(stored.employeeId, employee.id)
  })

  test('update lève une erreur pour un identifiant inconnu', async ({ assert }) => {
    const { employeeId, ...rest } = payload(0)
    await assert.rejects(() => new EducationService().update(1, 999_999_999, rest), /Row not found/)
  })

  test('findById renvoie la formation, delete la supprime', async ({ assert }) => {
    const { employee } = await createCandidate()
    const service = new EducationService()
    const created = await service.create(payload(employee.id))

    const found = await service.findById(created.id)
    assert.equal(found.id, created.id)

    await service.delete(employee.id, created.id)
    assert.isNull(await Education.find(created.id))
    await assert.rejects(() => service.findById(created.id), /Row not found/)
  })

  test('delete lève une erreur pour un identifiant inconnu', async ({ assert }) => {
    await assert.rejects(() => new EducationService().delete(1, 999_999_999), /Row not found/)
  })

  test("update et delete ignorent une formation d'un autre candidat", async ({ assert }) => {
    const { employee: owner } = await createCandidate()
    const { employee: other } = await createCandidate()
    const service = new EducationService()
    const created = await service.create(payload(owner.id))
    const { employeeId, ...rest } = payload(owner.id)

    await assert.rejects(() => service.update(other.id, created.id, rest), /Row not found/)
    await assert.rejects(() => service.delete(other.id, created.id), /Row not found/)

    const stored = await Education.findOrFail(created.id)
    assert.equal(stored.employeeId, owner.id)
  })
})
