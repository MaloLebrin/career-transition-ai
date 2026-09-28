import { CloudinaryService } from '#services/cloudinary_service'
import type { CloudinaryAsset, CloudinaryUploadResult } from '#shared/types/storage/cloudinary'
import app from '@adonisjs/core/services/app'
import { readFile } from 'node:fs/promises'
import { Readable } from 'node:stream'

/**
 * Remplace `CloudinaryService` par un stockage en mémoire (repris de
 * `swapFakeCloudinary` de boat-management). Aucun appel réseau : les octets
 * envoyés sont gardés par `publicId`, relus par `download`, retirés par
 * `destroy`, et chaque appel est journalisé pour les assertions.
 *
 * ```ts
 * let cloud: FakeCloudinary
 * group.each.setup(() => {
 *   cloud = swapFakeCloudinary()
 *   return () => restoreCloudinary()
 * })
 * ```
 */
export class FakeCloudinary extends CloudinaryService {
  /** Fichiers présents, par `publicId`. */
  readonly files = new Map<string, { bytes: Buffer; asset: CloudinaryAsset }>()
  readonly uploaded: CloudinaryAsset[] = []
  readonly downloaded: CloudinaryAsset[] = []
  readonly destroyed: CloudinaryAsset[] = []

  async uploadBuffer(bytes: Uint8Array, asset: CloudinaryAsset): Promise<CloudinaryUploadResult> {
    this.files.set(asset.publicId, { bytes: Buffer.from(bytes), asset })
    this.uploaded.push(asset)
    return {
      ...asset,
      bytes: bytes.byteLength,
      secureUrl: `https://res.cloudinary.com/fake/${asset.resourceType}/${asset.deliveryType}/${asset.publicId}`,
    }
  }

  async uploadFile(path: string, asset: CloudinaryAsset): Promise<CloudinaryUploadResult> {
    return this.uploadBuffer(await readFile(path), asset)
  }

  async download(asset: CloudinaryAsset): Promise<Readable | null> {
    this.downloaded.push(asset)
    const file = this.files.get(asset.publicId)
    return file ? Readable.from([file.bytes]) : null
  }

  async destroy(asset: CloudinaryAsset): Promise<boolean> {
    this.destroyed.push(asset)
    return this.files.delete(asset.publicId)
  }

  has(publicId: string): boolean {
    return this.files.has(publicId)
  }
}

export function swapFakeCloudinary(): FakeCloudinary {
  const fake = new FakeCloudinary()
  app.container.swap(CloudinaryService, () => fake)
  return fake
}

export function restoreCloudinary(): void {
  app.container.restore(CloudinaryService)
}
