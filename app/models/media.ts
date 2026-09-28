import Organization from '#models/organization'
import User from '#models/user'
import type { MediaEntityType, MediaKind } from '#shared/constants/media'
import type {
  CloudinaryDeliveryType,
  CloudinaryResourceType,
} from '#shared/types/storage/cloudinary'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

/**
 * Fichier stocké sur Cloudinary et rattaché à une entité (issue #50).
 * Polymorphe (`entityType` + `entityId`) : aucune clé étrangère vers l'entité,
 * la suppression passe par `#services/media_service` (`deleteAllForEntity`).
 */
export default class Media extends BaseModel {
  static table = 'media'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare entityType: MediaEntityType

  @column()
  declare entityId: number

  @column()
  declare organizationId: number

  @column()
  declare kind: MediaKind

  /** Jamais exposé : le fichier ne se lit qu'au travers du serveur. */
  @column({ serializeAs: null })
  declare cloudinaryPublicId: string

  @column()
  declare resourceType: CloudinaryResourceType

  @column()
  declare deliveryType: CloudinaryDeliveryType

  @column()
  declare originalFilename: string

  @column()
  declare format: string | null

  @column()
  declare bytes: number

  @column()
  declare uploadedById: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Organization)
  declare organization: BelongsTo<typeof Organization>

  @belongsTo(() => User, { foreignKey: 'uploadedById' })
  declare uploadedBy: BelongsTo<typeof User>
}
