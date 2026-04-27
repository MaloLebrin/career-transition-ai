import type { PdfExportStatus } from '#shared/constants/pdf_export'

export type PdfExportListItem = {
  id: number
  userId: number
  organizationId: number | null
  employeeId: number
  employeeName: string | null
  advisorUserId: number | null
  status: PdfExportStatus
  errorMessage: string | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  downloadUrl: string | null
  fileName: string | null
}
