import { MediaNotFoundError } from '#exceptions/media_errors'
import Media from '#models/media'
import { MediaService } from '#services/media_service'
import { MEDIA_ENTITY_TYPES } from '#shared/constants/media'
import type { IncomingMediaFile, MediaOwner } from '#shared/types/media/documents'
import { createCandidate } from '#tests/support/actors'
import {
  FakeCloudinary,
  restoreCloudinary,
  swapFakeCloudinary,
} from '#tests/support/fake_cloudinary'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * `MediaService` (issue #50) sur le fake Cloudinary : fichier privé sous un
 * `public_id` sans nom, destruction compensatoire, scoping, suppression.
 */

async function incomingFile(
  name = 'CV Élodie.PDF',
  contents = '%PDF-1.4'
): Promise<IncomingMediaFile> {
  const dir = await mkdtemp(join(tmpdir(), 'media-'))
  const tmpPath = join(dir, 'upload')
  await writeFile(tmpPath, contents)
  return { tmpPath, clientName: name, extname: 'PDF', size: contents.length }
}

async function ownerFor(): Promise<MediaOwner> {
  const { employee } = await createCandidate()
  return {
    entityType: MEDIA_ENTITY_TYPES.EMPLOYEE,
    entityId: employee.id,
    organizationId: employee.organizationId,
  }
}

test.group('MediaService', (group) => {
  let cloud: FakeCloudinary

  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    cloud = swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  const service = () => app.container.make(MediaService)

  test('upload : fichier privé, public_id dérivé d’ids, nom d’origine en base', async ({
    assert,
  }) => {
    const owner = await ownerFor()

    const mediaService = await service()
    const media = await mediaService.upload({
      ...owner,
      kind: 'cv',
      file: await incomingFile(),
      uploadedById: null,
    })

    assert.match(
      media.cloudinaryPublicId,
      new RegExp(
        `^career-transition/dev/organizations/${owner.organizationId}/employees/${owner.entityId}/documents/doc_[0-9a-f-]{36}\\.pdf$`
      )
    )
    assert.notInclude(media.cloudinaryPublicId, 'lodie')
    assert.equal(media.originalFilename, 'CV Élodie.PDF')
    assert.equal(media.format, 'pdf')
    assert.equal(media.bytes, 8)
    assert.deepEqual(cloud.uploaded, [
      { publicId: media.cloudinaryPublicId, resourceType: 'raw', deliveryType: 'authenticated' },
    ])
  })

  test('upload : si l’insertion échoue, le fichier envoyé est détruit', async ({
    assert,
    cleanup,
  }) => {
    const owner = await ownerFor()
    const create = Media.create
    Media.create = async () => {
      throw new Error('db down')
    }
    cleanup(() => {
      Media.create = create
    })

    const mediaService = await service()
    const file = await incomingFile()
    await assert.rejects(
      () => mediaService.upload({ ...owner, kind: 'cv', file, uploadedById: null }),
      'db down'
    )

    assert.lengthOf(cloud.uploaded, 1)
    assert.deepEqual(cloud.destroyed, cloud.uploaded)
    assert.equal(cloud.files.size, 0)
  })

  test('get : un document d’une autre entité est introuvable', async ({ assert }) => {
    const owner = await ownerFor()
    const other = await ownerFor()
    const mediaService = await service()
    const media = await mediaService.upload({
      ...other,
      kind: 'other',
      file: await incomingFile(),
      uploadedById: null,
    })

    await assert.rejects(() => mediaService.get(owner, media.id), MediaNotFoundError)
    await assert.rejects(
      () => mediaService.get({ ...other, organizationId: owner.organizationId }, media.id),
      MediaNotFoundError
    )
    const found = await mediaService.get(other, media.id)
    assert.equal(found.id, media.id)
  })

  test('download : type MIME du format, 404 si le fichier a disparu', async ({ assert }) => {
    const owner = await ownerFor()
    const mediaService = await service()
    const media = await mediaService.upload({
      ...owner,
      kind: 'cv',
      file: await incomingFile(),
      uploadedById: null,
    })

    const { contentType } = await mediaService.download(media)
    assert.equal(contentType, 'application/pdf')

    cloud.files.clear()
    await assert.rejects(() => mediaService.download(media), MediaNotFoundError)
  })

  test('deleteAllForEntity : lignes supprimées dans la transaction, fichiers ensuite', async ({
    assert,
  }) => {
    const owner = await ownerFor()
    const other = await ownerFor()
    const mediaService = await service()
    for (const target of [owner, owner, other]) {
      await mediaService.upload({
        ...target,
        kind: 'other',
        file: await incomingFile(),
        uploadedById: null,
      })
    }

    const assets = await db.transaction((trx) =>
      mediaService.deleteAllForEntity(owner.entityType, owner.entityId, trx)
    )
    assert.lengthOf(assets, 2)
    assert.equal(cloud.files.size, 3, 'rien n’est détruit avant la validation')

    assert.equal(await mediaService.destroyFiles(assets), 2)
    assert.equal(await mediaService.count(owner), 0)
    assert.equal(await mediaService.count(other), 1)
    assert.equal(cloud.files.size, 1)
  })

  test('destroyFiles : un échec du stockage n’est pas propagé', async ({ assert }) => {
    cloud.destroy = async () => {
      throw new Error('cloudinary down')
    }

    const mediaService = await service()
    const destroyed = await mediaService.destroyFiles([
      { publicId: 'x', resourceType: 'raw', deliveryType: 'authenticated' },
    ])

    assert.equal(destroyed, 0)
  })
})
