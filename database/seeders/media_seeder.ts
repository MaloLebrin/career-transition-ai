import { missingCloudinaryEnv } from '#config/cloudinary'
import Employee from '#models/employee'
import Media from '#models/media'
import { CloudinaryFolders, CloudinaryService } from '#services/cloudinary_service'
import {
  MEDIA_DELIVERY_TYPES,
  MEDIA_ENTITY_TYPES,
  MEDIA_KINDS,
  MEDIA_RESOURCE_TYPES,
} from '#shared/constants/media'
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

/** PDF minimal (une page vide) pour le document de démonstration. */
const DEMO_PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj
trailer<</Root 1 0 R>>
%%EOF`

/**
 * Document de démonstration (issue #50) : un CV pour le candidat de démo, dans
 * `career-transition/dev/…`. Sans identifiants Cloudinary, rien n'est créé —
 * une ligne `media` sans fichier donnerait un téléchargement introuvable.
 */
export default class MediaSeeder extends BaseSeeder {
  async run() {
    if (missingCloudinaryEnv((name) => env.get(name)).length > 0) {
      logger.info('MediaSeeder : CLOUDINARY_* absentes, aucun document de démonstration.')
      return
    }

    const employee = await Employee.findBy('email', 'm.lebrin@example.fr')
    if (!employee) return

    const existing = await Media.query()
      .where('entityType', MEDIA_ENTITY_TYPES.EMPLOYEE)
      .where('entityId', employee.id)
      .first()
    if (existing) return

    const cloudinary = await app.container.make(CloudinaryService)
    const folder = CloudinaryFolders.documents(
      employee.organizationId,
      MEDIA_ENTITY_TYPES.EMPLOYEE,
      employee.id
    )
    const uploaded = await cloudinary.uploadBuffer(new TextEncoder().encode(DEMO_PDF), {
      publicId: `${folder}/doc_seed-cv.pdf`,
      resourceType: MEDIA_RESOURCE_TYPES.RAW,
      deliveryType: MEDIA_DELIVERY_TYPES.AUTHENTICATED,
    })

    await Media.create({
      entityType: MEDIA_ENTITY_TYPES.EMPLOYEE,
      entityId: employee.id,
      organizationId: employee.organizationId,
      kind: MEDIA_KINDS.CV,
      cloudinaryPublicId: uploaded.publicId,
      resourceType: uploaded.resourceType,
      deliveryType: uploaded.deliveryType,
      originalFilename: 'CV démo.pdf',
      format: 'pdf',
      bytes: uploaded.bytes,
      uploadedById: employee.userId,
    })
  }
}
