import {
  CandidateProfileNotFoundError,
  ErasureAlreadyRequestedError,
} from '#exceptions/candidate_data_errors'
import Employee from '#models/employee'
import { CandidateDataRequestsService } from '#services/candidate_data_requests_service'
import { CANDIDATE_DATA_FILENAME } from '#services/candidate_data_service'
import { dossierZipFilename } from '#services/dossier_export_service'
import { createAdvisor, createCandidate, createUser } from '#tests/support/actors'
import { restoreCloudinary, swapFakeCloudinary } from '#tests/support/fake_cloudinary'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/**
 * Unit — `CandidateDataRequestsService` (#70) : droits RGPD du candidat en
 * libre-service. Les notifications sont enregistrées par un faux service.
 */
class FakeCandidateNotifications {
  public erasureRequestedFor: number[] = []

  async erasureRequested(employee: Employee) {
    this.erasureRequestedFor.push(employee.id)
  }
}

function setup() {
  const notifications = new FakeCandidateNotifications()
  const service = new CandidateDataRequestsService(notifications as any)
  return { service, notifications }
}

test.group('CandidateDataRequestsService.export', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  test('renvoie l’archive ZIP du candidat connecté', async ({ assert }) => {
    const { user, employee } = await createCandidate()
    const { service } = setup()

    const { stream, fileName } = await service.export(user)
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(Buffer.from(chunk))
    const zip = Buffer.concat(chunks)

    assert.equal(zip.subarray(0, 2).toString(), 'PK')
    assert.include(zip.toString('latin1'), CANDIDATE_DATA_FILENAME)
    assert.equal(fileName, dossierZipFilename(employee.name))
  })

  test('compte sans fiche candidat → 404 métier', async ({ assert }) => {
    const user = await createUser(USERS_ROLES.EMPLOYEE)
    const { service } = setup()

    await assert.rejects(() => service.export(user), CandidateProfileNotFoundError)
  })
})

test.group('CandidateDataRequestsService.requestErasure', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('enregistre la date de la demande et prévient l’équipe', async ({ assert }) => {
    const advisor = await createAdvisor()
    const { user, employee } = await createCandidate({ advisor })
    const { service, notifications } = setup()

    await service.requestErasure(user)

    await employee.refresh()
    assert.isNotNull(employee.erasureRequestedAt)
    assert.deepEqual(notifications.erasureRequestedFor, [employee.id])
  })

  test('une demande déjà en cours est refusée sans renotifier', async ({ assert }) => {
    const requestedAt = DateTime.fromISO('2026-09-01T10:00:00.000Z')
    const { user, employee } = await createCandidate()
    employee.erasureRequestedAt = requestedAt
    await employee.save()
    const { service, notifications } = setup()

    await assert.rejects(() => service.requestErasure(user), ErasureAlreadyRequestedError)

    await employee.refresh()
    assert.equal(employee.erasureRequestedAt?.toMillis(), requestedAt.toMillis())
    assert.deepEqual(notifications.erasureRequestedFor, [])
  })

  test('fiche supprimée (soft delete) → 404 métier, rien n’est enregistré', async ({ assert }) => {
    const { user, employee } = await createCandidate()
    employee.deletedAt = DateTime.now()
    await employee.save()
    const { service, notifications } = setup()

    await assert.rejects(() => service.requestErasure(user), CandidateProfileNotFoundError)

    await employee.refresh()
    assert.isNull(employee.erasureRequestedAt)
    assert.deepEqual(notifications.erasureRequestedFor, [])
  })
})
