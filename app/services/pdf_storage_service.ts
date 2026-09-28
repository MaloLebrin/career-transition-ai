import PdfExport from '#models/pdf_export'
import {
  CloudinaryFolders,
  CloudinaryService,
  cloudinaryEnvRoot,
} from '#services/cloudinary_service'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import type { CloudinaryAsset } from '#shared/types/storage/cloudinary'
import app from '@adonisjs/core/services/app'
import type { DateTime } from 'luxon'
import type { Readable } from 'node:stream'

/**
 * Stockage des exports PDF sur Cloudinary (issue #49), en ressource `raw`
 * privée (`authenticated`). `pdf_exports.file_path` contient le `public_id`,
 * lu par le web quel que soit le service (worker) qui l'a écrit.
 */

export const PDF_MIME_TYPE = 'application/pdf'

/**
 * `public_id` d'un export : dérivé des ids seulement, pour ne pas mettre le
 * nom du candidat dans le stockage (le nom affiché reste
 * `pdf_exports.file_name`).
 */
export function pdfExportKey(organizationId: number, pdfExportId: number): string {
  return `${CloudinaryFolders.exports(organizationId)}/pdf_export_${pdfExportId}.pdf`
}

/** Écrit le PDF et renvoie sa taille en octets. */
export async function storePdf(key: string, bytes: Uint8Array): Promise<number> {
  const cloud = await storage()
  await cloud.uploadBuffer(bytes, pdfAsset(key))
  return bytes.byteLength
}

/**
 * Flux du PDF, ou `null` s'il est absent. Une clé qui n'a pas la forme d'un
 * export (ancienne clé `exports/…` du stockage Drive, chemin absolu, valeur
 * inattendue) est traitée comme absente : on ne lit jamais hors des exports.
 */
export async function readPdfStream(key: string): Promise<Readable | null> {
  if (!isPdfExportKey(key)) return null
  const cloud = await storage()
  return cloud.download(pdfAsset(key))
}

/** Supprime le PDF ; `false` s'il n'existait pas (ou clé hors exports). */
export async function deletePdf(key: string): Promise<boolean> {
  if (!isPdfExportKey(key)) return false
  const cloud = await storage()
  return cloud.destroy(pdfAsset(key))
}

export function isPdfExportKey(key: string): boolean {
  // La racine ne contient que des lettres, `-` et `/` : rien à échapper.
  return new RegExp(
    `^${cloudinaryEnvRoot()}/organizations/\\d+/exports/pdf_export_\\d+\\.pdf$`
  ).test(key)
}

function pdfAsset(key: string): CloudinaryAsset {
  return { publicId: key, resourceType: 'raw', deliveryType: 'authenticated' }
}

/** Résolu à chaque appel : le fake de test (`app.container.swap`) s'applique. */
function storage(): Promise<CloudinaryService> {
  return app.container.make(CloudinaryService)
}

/**
 * En-tête `Content-Disposition` d'un téléchargement : nom ASCII de repli et
 * nom UTF-8 (RFC 6266 / 5987) pour les accents.
 */
export function attachmentDisposition(fileName: string): string {
  const fallback = fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\]/g, '_')
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeRfc5987(fileName)}`
}

/**
 * Supprime du stockage les PDF des exports terminés avant `finishedBefore` et
 * retire leur clé (plus de lien de téléchargement). Renvoie le nombre
 * d'exports traités.
 */
export async function purgeExpiredPdfExports(finishedBefore: DateTime): Promise<number> {
  const expired = await PdfExport.query()
    .where('status', PDF_EXPORT_STATUSES.COMPLETED)
    .whereNotNull('filePath')
    .where('finishedAt', '<', finishedBefore.toSQL()!)

  for (const pdfExport of expired) {
    await deletePdf(pdfExport.filePath!)
    pdfExport.filePath = null
    await pdfExport.save()
  }
  return expired.length
}

function encodeRfc5987(value: string): string {
  return encodeURIComponent(value).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  )
}
