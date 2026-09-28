import cloudinary, { missingCloudinaryEnv } from '#config/cloudinary'
import { CloudinaryDownloadError, CloudinaryNotConfiguredError } from '#exceptions/storage_errors'
import { CloudinaryFolders, CloudinaryService } from '#services/cloudinary_service'
import type { CloudinaryAsset } from '#shared/types/storage/cloudinary'
import { overrideEnv } from '#tests/utils/env'
import { test } from '@japa/runner'
import type { Readable } from 'node:stream'

/**
 * `CloudinaryService` (issue #49) avec le SDK remplacé par des stubs : on
 * vérifie les options envoyées à Cloudinary (fichier privé, public_id
 * inchangé), le relais du téléchargement et le refus sans identifiants.
 * Aucun appel réseau.
 */

const PDF: CloudinaryAsset = {
  publicId: 'career-transition/dev/organizations/3/exports/pdf_export_9.pdf',
  resourceType: 'raw',
  deliveryType: 'authenticated',
}

const CREDENTIALS = {
  CLOUDINARY_CLOUD_NAME: 'demo',
  CLOUDINARY_API_KEY: 'key',
  CLOUDINARY_API_SECRET: 'secret',
}

async function readAll(stream: Readable): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString()
}

/** Remplace une méthode le temps du test ; renvoie la restauration. */
function stub<T extends object, K extends keyof T>(target: T, key: K, value: T[K]) {
  const original = target[key]
  target[key] = value
  return () => {
    target[key] = original
  }
}

test.group('config/cloudinary | identifiants', () => {
  test('liste les variables manquantes', ({ assert }) => {
    const values: Record<string, string> = { CLOUDINARY_CLOUD_NAME: 'demo' }
    assert.deepEqual(
      missingCloudinaryEnv((name) => values[name]),
      ['CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
    )
  })

  test('rien ne manque quand les trois sont renseignées', ({ assert }) => {
    assert.deepEqual(
      missingCloudinaryEnv((name) => CREDENTIALS[name]),
      []
    )
  })
})

test.group('CloudinaryService | dossiers', () => {
  test('dossiers par id d’organisation, sous la racine dev hors production', ({ assert }) => {
    assert.equal(CloudinaryFolders.organization(3), 'career-transition/dev/organizations/3')
    assert.equal(CloudinaryFolders.exports(3), 'career-transition/dev/organizations/3/exports')
  })
})

test.group('CloudinaryService | SDK', () => {
  test('uploadBuffer envoie un fichier privé sous le public_id demandé', async ({
    assert,
    cleanup,
  }) => {
    cleanup(overrideEnv(CREDENTIALS))
    let options: Record<string, unknown> = {}
    let sent: Buffer | null = null
    cleanup(
      stub(cloudinary.uploader, 'upload_stream', ((opts: any, callback: any) => {
        options = opts
        return {
          end: (bytes: Buffer) => {
            sent = bytes
            callback(undefined, { public_id: opts.public_id, bytes: bytes.length, secure_url: 'u' })
          },
        }
      }) as any)
    )

    const result = await new CloudinaryService().uploadBuffer(new TextEncoder().encode('%PDF'), PDF)

    assert.deepEqual(options, {
      public_id: PDF.publicId,
      resource_type: 'raw',
      type: 'authenticated',
      overwrite: true,
    })
    assert.equal(sent!.toString(), '%PDF')
    assert.deepEqual(result, { ...PDF, bytes: 4, secureUrl: 'u' })
  })

  test('download relaie le contenu via une URL signée courte', async ({ assert, cleanup }) => {
    cleanup(overrideEnv(CREDENTIALS))
    let signed: { publicId: string; options: any } | null = null
    cleanup(
      stub(cloudinary.utils, 'private_download_url', ((publicId: string, _f: string, opts: any) => {
        signed = { publicId, options: opts }
        return 'https://api.cloudinary.test/download'
      }) as any)
    )
    cleanup(stub(globalThis, 'fetch', (async () => new Response('%PDF-1.4 relu')) as any))

    const stream = await new CloudinaryService().download(PDF)

    assert.equal(await readAll(stream!), '%PDF-1.4 relu')
    assert.equal(signed!.publicId, PDF.publicId)
    assert.equal(signed!.options.type, 'authenticated')
    assert.equal(signed!.options.resource_type, 'raw')
    const ttl = signed!.options.expires_at - Math.floor(Date.now() / 1000)
    assert.isAbove(ttl, 0)
    assert.isAtMost(ttl, 5 * 60)
  })

  test('download : null si le fichier n’existe pas, erreur sinon', async ({ assert, cleanup }) => {
    cleanup(overrideEnv(CREDENTIALS))
    cleanup(stub(cloudinary.utils, 'private_download_url', (() => 'https://x.test') as any))
    let status = 404
    cleanup(stub(globalThis, 'fetch', (async () => new Response('non', { status })) as any))
    const service = new CloudinaryService()

    assert.isNull(await service.download(PDF))

    status = 401
    await assert.rejects(() => service.download(PDF), CloudinaryDownloadError)
  })

  test('destroy : true si supprimé, false si absent', async ({ assert, cleanup }) => {
    cleanup(overrideEnv(CREDENTIALS))
    const calls: Array<[string, any]> = []
    let answer = 'ok'
    cleanup(
      stub(cloudinary.uploader, 'destroy', (async (publicId: string, opts: any) => {
        calls.push([publicId, opts])
        return { result: answer }
      }) as any)
    )
    const service = new CloudinaryService()

    assert.isTrue(await service.destroy(PDF))
    answer = 'not found'
    assert.isFalse(await service.destroy(PDF))
    assert.deepEqual(calls[0], [
      PDF.publicId,
      { resource_type: 'raw', type: 'authenticated', invalidate: true },
    ])
  })

  test('sans identifiants : CloudinaryNotConfiguredError, aucun appel au SDK', async ({
    assert,
    cleanup,
  }) => {
    cleanup(
      overrideEnv({
        CLOUDINARY_CLOUD_NAME: undefined,
        CLOUDINARY_API_KEY: undefined,
        CLOUDINARY_API_SECRET: undefined,
      })
    )
    let called = false
    cleanup(
      stub(cloudinary.uploader, 'destroy', (async () => {
        called = true
        return { result: 'ok' }
      }) as any)
    )
    const service = new CloudinaryService()

    await assert.rejects(() => service.destroy(PDF), CloudinaryNotConfiguredError)
    await assert.rejects(
      () => service.uploadBuffer(new Uint8Array(), PDF),
      CloudinaryNotConfiguredError
    )
    await assert.rejects(() => service.download(PDF), CloudinaryNotConfiguredError)
    assert.isFalse(called)
  })
})
