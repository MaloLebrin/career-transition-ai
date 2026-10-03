import type { PdfExportStatus } from '#shared/constants/pdf_export'

/** Filtres de la liste des exports PDF (`PdfExportsService.listForUser`). */
export interface PdfExportListFilters {
  status?: PdfExportStatus | string
}
