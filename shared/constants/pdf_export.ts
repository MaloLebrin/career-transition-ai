export const PDF_EXPORT_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type PdfExportStatus = (typeof PDF_EXPORT_STATUSES)[keyof typeof PDF_EXPORT_STATUSES]

export const pdfExportStatusValues = Object.values(PDF_EXPORT_STATUSES)

/**
 * Durée de conservation d'un export PDF généré : passé ce délai, le fichier
 * est supprimé du stockage (`PurgeExpiredPdfExportsJob`) ; la ligne reste,
 * sans lien de téléchargement, et le PDF peut être régénéré.
 */
export const PDF_EXPORT_RETENTION_DAYS = 30
