import { MediaNotFoundError } from '#exceptions/media_errors'
import Media from '#models/media'
import { CloudinaryFolders, CloudinaryService } from '#services/cloudinary_service'
import { reportError } from '#services/error_tracking_service'
import {
  DOCUMENT_MIME_TYPES,
  MEDIA_DELIVERY_TYPES,
  MEDIA_RESOURCE_TYPES,
  type MediaEntityType,
} from '#shared/constants/media'
import type { MediaOwner, MediaUploadInput } from '#shared/types/media/documents'
import type { CloudinaryAsset } from '#shared/types/storage/cloudinary'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { randomUUID } from 'node:crypto'
import type { Readable } from 'node:stream'

export function mediaAsset(media: Media): CloudinaryAsset {
  return {
    publicId: media.cloudinaryPublicId,
    resourceType: media.resourceType,
    deliveryType: media.deliveryType,
  }
}

/**
 * Fichiers rattachés à une entité (table `media`, issue #50), stockés sur
 * Cloudinary en privé (`raw` + `authenticated`). Le `public_id` ne contient
 * que des ids et un UUID ; le nom d'origine reste en base.
 */
@inject()
export class MediaService {
  constructor(private cloudinary: CloudinaryService) {}

  /** Envoie le fichier puis crée la ligne ; si l'insertion échoue, le fichier est détruit. */
  async upload(input: MediaUploadInput): Promise<Media> {
    const format = (input.file.extname ?? '').toLowerCase() || null
    const folder = CloudinaryFolders.documents(
      input.organizationId,
      input.entityType,
      input.entityId
    )
    const uploaded = await this.cloudinary.uploadFile(input.file.tmpPath!, {
      publicId: `${folder}/doc_${randomUUID()}${format ? `.${format}` : ''}`,
      resourceType: MEDIA_RESOURCE_TYPES.RAW,
      deliveryType: MEDIA_DELIVERY_TYPES.AUTHENTICATED,
    })

    try {
      return await Media.create({
        entityType: input.entityType,
        entityId: input.entityId,
        organizationId: input.organizationId,
        kind: input.kind,
        cloudinaryPublicId: uploaded.publicId,
        resourceType: uploaded.resourceType,
        deliveryType: uploaded.deliveryType,
        originalFilename: input.file.clientName,
        format,
        bytes: uploaded.bytes,
        uploadedById: input.uploadedById,
      })
    } catch (error) {
      await this.destroyFiles([
        {
          publicId: uploaded.publicId,
          resourceType: uploaded.resourceType,
          deliveryType: uploaded.deliveryType,
        },
      ])
      throw error
    }
  }

  /** Fichiers de l'entité, du plus récent au plus ancien, avec leur auteur. */
  async list(owner: MediaOwner): Promise<Media[]> {
    return this.ownedBy(owner)
      .preload('uploadedBy')
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc')
  }

  async count(owner: MediaOwner): Promise<number> {
    const [row] = await this.ownedBy(owner).count('* as total')
    return Number(row.$extras.total)
  }

  /** Fichier de l'entité ; `MediaNotFoundError` s'il appartient à une autre (ou n'existe pas). */
  async get(owner: MediaOwner, mediaId: number): Promise<Media> {
    const media = await this.ownedBy(owner).where('id', mediaId).first()
    if (!media) throw new MediaNotFoundError()
    return media
  }

  /** Contenu relayé depuis Cloudinary (URL signée courte, jamais transmise au navigateur). */
  async download(media: Media): Promise<{ stream: Readable; contentType: string }> {
    const stream = await this.cloudinary.download(mediaAsset(media))
    if (!stream) throw new MediaNotFoundError('Le fichier est introuvable sur le stockage.')
    return {
      stream,
      contentType: DOCUMENT_MIME_TYPES[media.format ?? ''] ?? 'application/octet-stream',
    }
  }

  /** Supprime la ligne puis le fichier (best effort : un échec est signalé, pas propagé). */
  async delete(media: Media): Promise<void> {
    await media.delete()
    await this.destroyFiles([mediaAsset(media)])
  }

  /**
   * Supprime les lignes de l'entité (dans `trx` si fourni) et renvoie les
   * fichiers à détruire ensuite avec {@link destroyFiles} — une fois la
   * transaction validée, pour ne rien perdre si la base échoue.
   */
  async deleteAllForEntity(
    entityType: MediaEntityType,
    entityId: number,
    trx?: TransactionClientContract
  ): Promise<CloudinaryAsset[]> {
    const rows = await Media.query({ client: trx })
      .where('entityType', entityType)
      .where('entityId', entityId)
    await Media.query({ client: trx })
      .where('entityType', entityType)
      .where('entityId', entityId)
      .delete()
    return rows.map(mediaAsset)
  }

  /** Détruit les fichiers ; renvoie le nombre effectivement supprimés. */
  async destroyFiles(assets: CloudinaryAsset[]): Promise<number> {
    let destroyed = 0
    for (const asset of assets) {
      try {
        if (await this.cloudinary.destroy(asset)) destroyed++
      } catch (error) {
        logger.warn('media : suppression Cloudinary impossible')
        reportError(error, { tags: { feature: 'media' } })
      }
    }
    return destroyed
  }

  private ownedBy(owner: MediaOwner) {
    return Media.query()
      .where('entityType', owner.entityType)
      .where('entityId', owner.entityId)
      .where('organizationId', owner.organizationId)
  }
}
