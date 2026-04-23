import PdfExport from '#models/pdf_export'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import type { PdfExportListItem } from '#dtos/pdf_export_list_item'

export function serializePdfExport(row: PdfExport): PdfExportListItem {
  const downloadUrl =
    row.status === PDF_EXPORT_STATUSES.COMPLETED && row.filePath
      ? `/dashboard/pdf-exports/${row.id}/download`
      : null

  return {
    id: row.id,
    userId: row.userId,
    organizationId: row.organizationId,
    employeeId: row.employeeId,
    advisorUserId: row.advisorUserId,
    status: row.status,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt.toISO()!,
    startedAt: row.startedAt ? row.startedAt.toISO() : null,
    finishedAt: row.finishedAt ? row.finishedAt.toISO() : null,
    downloadUrl,
    fileName: row.fileName,
  }
}

