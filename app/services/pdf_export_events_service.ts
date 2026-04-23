import PdfExport from '#models/pdf_export'
import transmit from '@adonisjs/transmit/services/main'

function serialize(exportRow: PdfExport) {
  return {
    id: exportRow.id,
    userId: exportRow.userId,
    advisorUserId: exportRow.advisorUserId,
    organizationId: exportRow.organizationId,
    employeeId: exportRow.employeeId,
    status: exportRow.status,
    errorMessage: exportRow.errorMessage,
    fileName: exportRow.fileName,
    createdAt: exportRow.createdAt.toISO(),
    startedAt: exportRow.startedAt ? exportRow.startedAt.toISO() : null,
    finishedAt: exportRow.finishedAt ? exportRow.finishedAt.toISO() : null,
  }
}

export function broadcastPdfExportUpdatedToUsers(exportRow: PdfExport, userIds: number[]) {
  const unique = Array.from(new Set(userIds.filter((id) => Number.isFinite(id))))
  const payload = serialize(exportRow)
  for (const id of unique) {
    transmit.broadcast(`users/${id}/pdf-exports`, payload)
  }

  if (exportRow.organizationId) {
    transmit.broadcast(`organizations/${exportRow.organizationId}/pdf-exports`, payload)
  }
}

