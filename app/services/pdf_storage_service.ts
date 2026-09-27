import PdfExport from '#models/pdf_export'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import drive from '@adonisjs/drive/services/main'
import type { DateTime } from 'luxon'
import type { Readable } from 'node:stream'

/**
 * Stockage des exports PDF sur le disque Drive par défaut (`config/drive.ts`),
 * issue #21 : local (`fs`) ou bucket S3/R2 (`s3`). Web et worker n'ont plus à
 * partager un disque, et `pdf_exports.file_path` ne contient qu'une clé
 * relative.
 */

/** Préfixe des clés d'exports PDF. */
export const PDF_EXPORTS_PREFIX = 'exports'

export const PDF_MIME_TYPE = 'application/pdf'

/**
 * Clé d'un export : dérivée de son id seulement, pour ne pas mettre le nom du
 * candidat dans le stockage (le nom affiché reste `pdf_exports.file_name`).
 */
export function pdfExportKey(pdfExportId: number): string {
  return `${PDF_EXPORTS_PREFIX}/pdf_export_${pdfExportId}.pdf`
}

/** Écrit le PDF et renvoie sa taille en octets. */
export async function storePdf(key: string, bytes: Uint8Array): Promise<number> {
  await drive.use().put(key, bytes, { contentType: PDF_MIME_TYPE })
  return bytes.byteLength
}

/**
 * Flux du PDF, ou `null` s'il est absent. Une clé qui n'est pas sous
 * `exports/` (ancien chemin absolu, valeur inattendue) est traitée comme
 * absente : on ne lit jamais hors du préfixe.
 */
export async function readPdfStream(key: string): Promise<Readable | null> {
  if (!isPdfExportKey(key)) return null
  const disk = drive.use()
  if (!(await disk.exists(key))) return null
  return disk.getStream(key)
}

/** Supprime le PDF ; `false` s'il n'existait pas (ou clé hors préfixe). */
export async function deletePdf(key: string): Promise<boolean> {
  if (!isPdfExportKey(key)) return false
  const disk = drive.use()
  if (!(await disk.exists(key))) return false
  await disk.delete(key)
  return true
}

export function isPdfExportKey(key: string): boolean {
  return key.startsWith(`${PDF_EXPORTS_PREFIX}/`) && !key.split('/').includes('..')
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
