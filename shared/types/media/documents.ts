import type { MediaEntityType, MediaKind } from '#shared/constants/media'

/** Document d'un candidat tel qu'affiché (profil candidat et fiche conseiller). */
export interface CandidateDocumentDto {
  id: number
  kind: MediaKind
  originalFilename: string
  format: string | null
  bytes: number
  createdAt: string
  /** Nom de la personne qui a déposé le document (`null` si compte supprimé). */
  uploadedByName: string | null
  /** L'utilisateur courant peut supprimer ce document. */
  canDelete: boolean
}

/** Props de la section « Documents » du profil. */
export interface CandidateDocumentsProps {
  documents: CandidateDocumentDto[]
  /** Base des routes (`/dashboard/candidat/documents` ou `…/employees/:id/documents`). */
  baseUrl: string
}

/** Fichier reçu en multipart, réduit à ce que le stockage utilise. */
export interface IncomingMediaFile {
  tmpPath?: string
  clientName: string
  extname?: string
  size: number
}

/** Entrée de `MediaService.upload`. */
export interface MediaUploadInput {
  entityType: MediaEntityType
  entityId: number
  organizationId: number
  kind: MediaKind
  file: IncomingMediaFile
  uploadedById: number | null
}

/** Entité porteuse de fichiers, toujours accompagnée de son organisation (scoping). */
export interface MediaOwner {
  entityType: MediaEntityType
  entityId: number
  organizationId: number
}
