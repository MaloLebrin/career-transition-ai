/** Type de ressource Cloudinary : `raw` pour les PDF et documents, `image` pour le logo. */
export type CloudinaryResourceType = 'image' | 'raw'

/**
 * Mode de livraison : `authenticated` (privé, URL signée par le serveur) pour
 * tout fichier candidat, `upload` (public) réservé au logo d'organisation.
 */
export type CloudinaryDeliveryType = 'authenticated' | 'upload'

/** Identifie un fichier stocké. */
export interface CloudinaryAsset {
  publicId: string
  resourceType: CloudinaryResourceType
  deliveryType: CloudinaryDeliveryType
}

/** Résultat d'un upload. */
export interface CloudinaryUploadResult extends CloudinaryAsset {
  bytes: number
  secureUrl: string
}
