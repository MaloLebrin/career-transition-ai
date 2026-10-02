import PdfExport from '#models/pdf_export'
import { PlatformOrganizationService } from '#services/platform_organization_service'
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

/**
 * Charge utile du canal d'organisation : sans `fileName` (il porte le nom du
 * candidat). Le propriétaire de l'export reçoit la charge complète sur son canal.
 */
function serializeForOrganization(exportRow: PdfExport) {
  const payload: Partial<ReturnType<typeof serialize>> = serialize(exportRow)
  delete payload.fileName
  return payload
}

export async function broadcastPdfExportUpdatedToUsers(exportRow: PdfExport, userIds: number[]) {
  const unique = Array.from(new Set(userIds.filter((id) => Number.isFinite(id))))
  const payload = serialize(exportRow)
  for (const id of unique) {
    transmit.broadcast(`users/${id}/pdf-exports`, payload)
  }

  // L'organisation plateforme porte les candidats B2C : aucun canal partagé.
  if (exportRow.organizationId) {
    const platformId = await new PlatformOrganizationService().getId().catch(() => null)
    if (exportRow.organizationId !== platformId) {
      transmit.broadcast(
        `organizations/${exportRow.organizationId}/pdf-exports`,
        serializeForOrganization(exportRow)
      )
    }
  }
}
