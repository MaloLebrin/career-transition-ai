import Organization from '#models/organization'
import { BrandingService } from '#services/branding_service'
import {
  FakeCloudinary,
  restoreCloudinary,
  swapFakeCloudinary,
} from '#tests/support/fake_cloudinary'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * `BrandingService` (issue #51) sur le fake Cloudinary : dossier et visibilité
 * du logo, suppression de l'ancien fichier, nettoyage compensatoire quand
 * l'enregistrement échoue.
 */

async function logoFile(contents = 'PNG'): Promise<MultipartFile> {
  const dir = await mkdtemp(join(tmpdir(), 'logo-'))
  const tmpPath = join(dir, 'logo.png')
  await writeFile(tmpPath, contents)
  return { tmpPath } as MultipartFile
}

async function makeOrganization() {
  return Organization.create({ name: `Cabinet ${Date.now()}`, logoUrl: null })
}

test.group('BrandingService', (group) => {
  let cloud: FakeCloudinary

  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    cloud = swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  const service = () => app.container.make(BrandingService)

  test('uploadLogo : image publique dans le dossier logo de l’organisation', async ({ assert }) => {
    const org = await makeOrganization()

    const branding = await service()

    const dto = await branding.uploadLogo(org.id, await logoFile())

    await org.refresh()
    assert.match(
      org.logoPublicId!,
      new RegExp(`^career-transition/dev/organizations/${org.id}/logo/logo_[0-9a-f-]{36}$`)
    )
    assert.deepEqual(cloud.uploaded, [
      { publicId: org.logoPublicId!, resourceType: 'image', deliveryType: 'upload' },
    ])
    assert.equal(org.logoUrl, dto.logoUrl)
    assert.include(org.logoUrl!, org.logoPublicId!)
    assert.isTrue(cloud.has(org.logoPublicId!))
  })

  test('remplacer le logo détruit l’ancien après l’enregistrement', async ({ assert }) => {
    const org = await makeOrganization()
    const branding = await service()
    await branding.uploadLogo(org.id, await logoFile('v1'))
    await org.refresh()
    const first = org.logoPublicId!

    await branding.uploadLogo(org.id, await logoFile('v2'))

    await org.refresh()
    assert.notEqual(org.logoPublicId, first)
    assert.isFalse(cloud.has(first))
    assert.isTrue(cloud.has(org.logoPublicId!))
    assert.deepEqual(
      cloud.destroyed.map((a) => a.publicId),
      [first]
    )
  })

  test('enregistrement en échec : le nouvel upload est détruit, l’ancien logo reste', async ({
    assert,
    cleanup,
  }) => {
    const org = await makeOrganization()
    const branding = await service()
    await branding.uploadLogo(org.id, await logoFile('v1'))
    await org.refresh()
    const previous = { url: org.logoUrl, publicId: org.logoPublicId! }

    // Le `save` échoue (base indisponible) : stub le temps du test.
    const proto = Organization.prototype as unknown as Record<string, unknown>
    proto.save = async () => {
      throw new Error('db down')
    }
    cleanup(() => {
      delete proto.save
    })

    await assert.rejects(async () => branding.uploadLogo(org.id, await logoFile('v2')), 'db down')
    delete proto.save

    await org.refresh()
    assert.equal(org.logoUrl, previous.url)
    assert.equal(org.logoPublicId, previous.publicId)
    assert.deepEqual([...cloud.files.keys()], [previous.publicId])
  })

  test('deleteLogo vide les colonnes et détruit le fichier', async ({ assert }) => {
    const org = await makeOrganization()
    const branding = await service()
    await branding.uploadLogo(org.id, await logoFile())
    await org.refresh()
    const publicId = org.logoPublicId!

    const dto = await branding.deleteLogo(org.id)

    await org.refresh()
    assert.isNull(org.logoUrl)
    assert.isNull(org.logoPublicId)
    assert.isUndefined(dto.logoUrl)
    assert.isFalse(cloud.has(publicId))
  })

  test('deleteLogo sans public_id (ancienne URL saisie) : aucun appel Cloudinary', async ({
    assert,
  }) => {
    const org = await Organization.create({ name: 'Ancien', logoUrl: 'https://cdn.test/l.png' })

    const branding = await service()

    await branding.deleteLogo(org.id)

    await org.refresh()
    assert.isNull(org.logoUrl)
    assert.deepEqual(cloud.destroyed, [])
  })

  test('échec de suppression de l’ancien fichier : le nouveau logo est gardé', async ({
    assert,
  }) => {
    const org = await makeOrganization()
    const branding = await service()
    await branding.uploadLogo(org.id, await logoFile('v1'))
    cloud.destroy = async () => {
      throw new Error('cloudinary down')
    }

    await branding.uploadLogo(org.id, await logoFile('v2'))

    await org.refresh()
    assert.isTrue(cloud.has(org.logoPublicId!))
  })
})
