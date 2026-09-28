/**
 * Fichiers stockés sur Cloudinary et rattachés à une entité (table `media`,
 * polymorphe comme dans boat-management). Issue #50.
 */

/** Entités qui peuvent porter des fichiers (`media.entity_type`). */
export const MEDIA_ENTITY_TYPES = {
  EMPLOYEE: 'employee',
} as const

export type MediaEntityType = (typeof MEDIA_ENTITY_TYPES)[keyof typeof MEDIA_ENTITY_TYPES]
export const mediaEntityTypeValues = Object.values(MEDIA_ENTITY_TYPES)

/** Nature du document (`media.kind`). */
export const MEDIA_KINDS = {
  CV: 'cv',
  COVER_LETTER: 'cover_letter',
  CERTIFICATE: 'certificate',
  DIPLOMA: 'diploma',
  OTHER: 'other',
} as const

export type MediaKind = (typeof MEDIA_KINDS)[keyof typeof MEDIA_KINDS]
export const mediaKindValues = Object.values(MEDIA_KINDS)

export const MEDIA_KIND_LABELS: Record<MediaKind, string> = {
  cv: 'CV',
  cover_letter: 'Lettre de motivation',
  certificate: 'Certificat',
  diploma: 'Diplôme',
  other: 'Autre',
}

/** Type de ressource Cloudinary (`media.resource_type`). */
export const MEDIA_RESOURCE_TYPES = {
  IMAGE: 'image',
  RAW: 'raw',
} as const
export const mediaResourceTypeValues = Object.values(MEDIA_RESOURCE_TYPES)

/** Mode de livraison Cloudinary (`media.delivery_type`) : privé par défaut. */
export const MEDIA_DELIVERY_TYPES = {
  AUTHENTICATED: 'authenticated',
  UPLOAD: 'upload',
} as const
export const mediaDeliveryTypeValues = Object.values(MEDIA_DELIVERY_TYPES)

/** Documents candidat : limites partagées front / validateur / service. */
export const CANDIDATE_DOCUMENT_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'jpg',
  'jpeg',
  'png',
  'webp',
] as const
export const CANDIDATE_DOCUMENT_MAX_SIZE = '10mb'
export const MAX_CANDIDATE_DOCUMENTS = 30

/** `Content-Type` des téléchargements, par format (repli : `application/octet-stream`). */
export const DOCUMENT_MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}
