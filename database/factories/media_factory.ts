import Media from '#models/media'
import {
  MEDIA_DELIVERY_TYPES,
  MEDIA_ENTITY_TYPES,
  MEDIA_KINDS,
  MEDIA_RESOURCE_TYPES,
} from '#shared/constants/media'
import factory from '@adonisjs/lucid/factories'

export const MediaFactory = factory
  .define(Media, ({ faker }) => {
    return {
      entityType: MEDIA_ENTITY_TYPES.EMPLOYEE,
      entityId: 0, // à surcharger
      organizationId: 0, // à surcharger
      kind: MEDIA_KINDS.OTHER,
      cloudinaryPublicId: `career-transition/dev/test/doc_${faker.string.uuid()}.pdf`,
      resourceType: MEDIA_RESOURCE_TYPES.RAW,
      deliveryType: MEDIA_DELIVERY_TYPES.AUTHENTICATED,
      originalFilename: 'document.pdf',
      format: 'pdf',
      bytes: faker.number.int({ min: 1_000, max: 500_000 }),
      uploadedById: null,
    }
  })
  .build()
