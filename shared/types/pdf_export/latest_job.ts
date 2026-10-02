import type { PdfExportStatus } from '#shared/constants/pdf_export'

/** Dernier export PDF d'un candidat tel qu'exposé aux pages synthèse (`latestPdfJob`). */
export interface LatestPdfJob {
  id: number
  status: PdfExportStatus
  downloadUrl: string | null
}
