import cloudinary, { missingCloudinaryEnv } from '#config/cloudinary'
import { CloudinaryDownloadError, CloudinaryNotConfiguredError } from '#exceptions/storage_errors'
import type { CloudinaryAsset, CloudinaryUploadResult } from '#shared/types/storage/cloudinary'
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { Readable } from 'node:stream'
import type { ReadableStream as WebReadableStream } from 'node:stream/web'

/** Racine de tous les fichiers de l'application dans le compte Cloudinary. */
export const CLOUDINARY_ROOT = 'career-transition'

/** Durée de validité d'une URL de téléchargement signée (secondes). */
const DOWNLOAD_URL_TTL_SECONDS = 5 * 60

/**
 * `career-transition/production` ou `career-transition/dev` : un compte peut
 * servir aux deux sans mélanger les fichiers.
 */
export function cloudinaryEnvRoot(): string {
  return `${CLOUDINARY_ROOT}/${app.inProduction ? 'production' : 'dev'}`
}

/**
 * Dossiers par organisation. Dérivés d'ids, jamais d'un nom (ni d'un slug
 * modifiable) : aucune donnée personnelle dans les `public_id`.
 */
export const CloudinaryFolders = {
  organization: (organizationId: number) =>
    `${cloudinaryEnvRoot()}/organizations/${organizationId}`,
  exports: (organizationId: number) => `${CloudinaryFolders.organization(organizationId)}/exports`,
  logo: (organizationId: number) => `${CloudinaryFolders.organization(organizationId)}/logo`,
}

/**
 * Accès au stockage Cloudinary. Injecté ou résolu via le conteneur
 * (`app.container.make`) pour que les tests le remplacent par le fake en
 * mémoire (`#tests/support/fake_cloudinary`) : aucun appel réseau en test.
 */
export class CloudinaryService {
  /** Envoie des octets générés par l'application (PDF…) sous `asset.publicId`. */
  async uploadBuffer(bytes: Uint8Array, asset: CloudinaryAsset): Promise<CloudinaryUploadResult> {
    this.ensureConfigured()
    const result = await new Promise<{ public_id: string; bytes: number; secure_url: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            public_id: asset.publicId,
            resource_type: asset.resourceType,
            type: asset.deliveryType,
            overwrite: true,
          },
          (error, response) => (error || !response ? reject(error) : resolve(response))
        )
        stream.end(Buffer.from(bytes))
      }
    )
    return {
      ...asset,
      publicId: result.public_id,
      bytes: result.bytes,
      secureUrl: result.secure_url,
    }
  }

  /**
   * Envoie un fichier reçu en multipart (`file.tmpPath`) sous `asset.publicId`.
   * Le SDK lit le fichier temporaire lui-même : aucun accès disque ici.
   */
  async uploadFile(path: string, asset: CloudinaryAsset): Promise<CloudinaryUploadResult> {
    this.ensureConfigured()
    const result = await cloudinary.uploader.upload(path, {
      public_id: asset.publicId,
      resource_type: asset.resourceType,
      type: asset.deliveryType,
      overwrite: true,
    })
    return {
      ...asset,
      publicId: result.public_id,
      bytes: result.bytes,
      secureUrl: result.secure_url,
    }
  }

  /**
   * Flux du fichier, ou `null` s'il n'existe pas. Le serveur signe une URL de
   * téléchargement courte et relaie le contenu : l'URL n'est jamais donnée au
   * navigateur.
   */
  async download(asset: CloudinaryAsset): Promise<Readable | null> {
    this.ensureConfigured()
    const url = cloudinary.utils.private_download_url(asset.publicId, '', {
      resource_type: asset.resourceType,
      type: asset.deliveryType,
      expires_at: Math.floor(Date.now() / 1000) + DOWNLOAD_URL_TTL_SECONDS,
    })
    const response = await fetch(url)
    if (response.status === 404) return null
    if (!response.ok || !response.body) throw new CloudinaryDownloadError(response.status)
    return Readable.fromWeb(response.body as WebReadableStream<Uint8Array>)
  }

  /** Supprime le fichier ; `false` s'il n'existait pas. */
  async destroy(asset: CloudinaryAsset): Promise<boolean> {
    this.ensureConfigured()
    const result = await cloudinary.uploader.destroy(asset.publicId, {
      resource_type: asset.resourceType,
      type: asset.deliveryType,
      invalidate: true,
    })
    return result?.result === 'ok'
  }

  private ensureConfigured() {
    if (missingCloudinaryEnv((name) => env.get(name)).length > 0) {
      throw new CloudinaryNotConfiguredError()
    }
  }
}
