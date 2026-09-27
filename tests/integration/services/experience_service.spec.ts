import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Experience from '#models/experience'
import { ExperienceService } from '#services/experience_service'
import { EXPERIENCES_TYPES } from '#shared/constants/experience'
import { createCandidate } from '#tests/support/actors'

function payload(employeeId: number) {
  return {
    employeeId,
    title: 'Chargée de recrutement',
    company: 'ACME',
    type: EXPERIENCES_TYPES.CDD,
    startDate: DateTime.fromISO('2019-01-01'),
    endDate: DateTime.fromISO('2020-12-31'),
    isCurrent: false,
    description: null,
  }
}

test.group('ExperienceService', () => {
  test('create persiste l’expérience rattachée au candidat', async ({ assert }) => {
    const { employee } = await createCandidate()

    const experience = await new ExperienceService().create(payload(employee.id))

    const stored = await Experience.findOrFail(experience.id)
    assert.equal(stored.employeeId, employee.id)
    assert.equal(stored.type, 'cdd')
    assert.equal(stored.startDate.toISODate(), '2019-01-01')
    assert.equal(stored.endDate!.toISODate(), '2020-12-31')
  })

  test('update fusionne les champs sans exiger employeeId', async ({ assert }) => {
    const { employee } = await createCandidate()
    const service = new ExperienceService()
    const created = await service.create(payload(employee.id))

    const { employeeId, ...rest } = payload(employee.id)
    await service.update(employee.id, created.id, {
      ...rest,
      title: 'Responsable RH',
      type: EXPERIENCES_TYPES.CDI,
      endDate: null,
      isCurrent: true,
    })

    const stored = await Experience.findOrFail(created.id)
    assert.equal(stored.title, 'Responsable RH')
    assert.equal(stored.type, 'cdi')
    assert.isNull(stored.endDate)
    assert.isTrue(stored.isCurrent)
    assert.equal(stored.employeeId, employee.id)
  })

  test('update lève une erreur pour un identifiant inconnu', async ({ assert }) => {
    const { employeeId, ...rest } = payload(0)
    await assert.rejects(
      () => new ExperienceService().update(1, 999_999_999, rest),
      /Row not found/
    )
  })

  test('findById renvoie l’expérience, delete la supprime', async ({ assert }) => {
    const { employee } = await createCandidate()
    const service = new ExperienceService()
    const created = await service.create(payload(employee.id))

    const found = await service.findById(created.id)
    assert.equal(found.id, created.id)

    await service.delete(employee.id, created.id)
    assert.isNull(await Experience.find(created.id))
  })

  test('delete lève une erreur pour un identifiant inconnu', async ({ assert }) => {
    await assert.rejects(() => new ExperienceService().delete(1, 999_999_999), /Row not found/)
  })

  test("update et delete ignorent une expérience d'un autre candidat", async ({ assert }) => {
    const { employee: owner } = await createCandidate()
    const { employee: other } = await createCandidate()
    const service = new ExperienceService()
    const created = await service.create(payload(owner.id))
    const { employeeId, ...rest } = payload(owner.id)

    await assert.rejects(() => service.update(other.id, created.id, rest), /Row not found/)
    await assert.rejects(() => service.delete(other.id, created.id), /Row not found/)

    const stored = await Experience.findOrFail(created.id)
    assert.equal(stored.employeeId, owner.id)
  })
})
