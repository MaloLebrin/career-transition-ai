import { MediaFactory } from '#database/factories/media_factory'
import {
  MediaForbiddenError,
  MediaLimitReachedError,
  MediaNotFoundError,
} from '#exceptions/media_errors'
import { CandidateDocumentsService } from '#services/candidate_documents_service'
import { MAX_CANDIDATE_DOCUMENTS } from '#shared/constants/media'
import type { IncomingMediaFile } from '#shared/types/media/documents'
import { createAdvisor, createCandidate, createEmployeeFor } from '#tests/support/actors'
import { documentsOf } from '#tests/support/documents'
import {
  FakeCloudinary,
  restoreCloudinary,
  swapFakeCloudinary,
} from '#tests/support/fake_cloudinary'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

async function cvFile(): Promise<IncomingMediaFile> {
  const dir = await mkdtemp(join(tmpdir(), 'cv-'))
  const tmpPath = join(dir, 'cv')
  await writeFile(tmpPath, '%PDF-1.4 cv')
  return { tmpPath, clientName: 'cv.pdf', extname: 'pdf', size: 11 }
}

test.group('CandidateDocumentsService', (group) => {
  let cloud: FakeCloudinary

  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    cloud = swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  const service = () => app.container.make(CandidateDocumentsService)

  test('employeeFor : sa fiche pour un candidat, celle de son cabinet pour un conseiller', async ({
    assert,
  }) => {
    const advisor = await createAdvisor()
    const followed = await createEmployeeFor(advisor)
    const { user, employee } = await createCandidate()
    const documents = await service()

    const own = await documents.employeeFor(user)
    assert.equal(own.id, employee.id)
    const followedSheet = await documents.employeeFor(advisor, followed.id)
    assert.equal(followedSheet.id, followed.id)
    await assert.rejects(() => documents.employeeFor(advisor, employee.id))
    await assert.rejects(() => documents.employeeFor(advisor, Number.NaN), MediaNotFoundError)
  })

  test('list : auteur et droit de suppression selon qui regarde', async ({ assert }) => {
    const advisor = await createAdvisor()
    const { user, employee } = await createCandidate({ advisor })
    const documents = await service()
    await documents.upload(employee, user, await cvFile(), 'cv')
    await documents.upload(employee, advisor, await cvFile(), 'other')

    const seenByCandidate = await documents.list(employee, user)
    const seenByAdvisor = await documents.list(employee, advisor)

    assert.deepEqual(
      seenByCandidate.map((d) => [d.kind, d.canDelete, d.uploadedByName]),
      [
        ['other', false, advisor.name],
        ['cv', true, user.name],
      ]
    )
    assert.isTrue(seenByAdvisor.every((d) => d.canDelete))
  })

  test('upload : refusé au-delà de la limite', async ({ assert }) => {
    const { user, employee } = await createCandidate()
    await MediaFactory.merge({
      entityId: employee.id,
      organizationId: employee.organizationId,
    }).createMany(MAX_CANDIDATE_DOCUMENTS)

    const documents = await service()
    const file = await cvFile()
    await assert.rejects(() => documents.upload(employee, user, file, 'cv'), MediaLimitReachedError)
    assert.deepEqual(cloud.uploaded, [])
  })

  test('delete : le candidat ne supprime pas le dépôt de son conseiller', async ({ assert }) => {
    const advisor = await createAdvisor()
    const { user, employee } = await createCandidate({ advisor })
    const documents = await service()
    const media = await documents.upload(employee, advisor, await cvFile(), 'other')

    await assert.rejects(() => documents.delete(employee, user, media.id), MediaForbiddenError)
    await documents.delete(employee, advisor, media.id)
    assert.lengthOf(await documentsOf(employee), 0)
  })

  test('storeImportedCv : conservé comme CV du candidat connecté', async ({ assert }) => {
    const { user, employee } = await createCandidate()

    const documents = await service()
    const media = await documents.storeImportedCv(user, await cvFile())

    assert.equal(media!.kind, 'cv')
    assert.equal(media!.entityId, employee.id)
    assert.equal(media!.uploadedById, user.id)
  })

  test('storeImportedCv : rien pour un conseiller, ni au-delà de la limite', async ({ assert }) => {
    const advisor = await createAdvisor()
    const { user, employee } = await createCandidate()
    await MediaFactory.merge({
      entityId: employee.id,
      organizationId: employee.organizationId,
    }).createMany(MAX_CANDIDATE_DOCUMENTS)
    const documents = await service()

    assert.isNull(await documents.storeImportedCv(advisor, await cvFile()))
    assert.isNull(await documents.storeImportedCv(user, await cvFile()))
    assert.deepEqual(cloud.uploaded, [])
  })

  test('storeImportedCv : un échec du stockage renvoie null sans lever', async ({ assert }) => {
    const { user, employee } = await createCandidate()
    cloud.uploadFile = async () => {
      throw new Error('cloudinary down')
    }

    const documents = await service()
    assert.isNull(await documents.storeImportedCv(user, await cvFile()))
    assert.lengthOf(await documentsOf(employee), 0)
  })
})
