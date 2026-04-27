export const PDF_EXPORT_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type PdfExportStatus = (typeof PDF_EXPORT_STATUSES)[keyof typeof PDF_EXPORT_STATUSES]

export const pdfExportStatusValues = Object.values(PDF_EXPORT_STATUSES)
