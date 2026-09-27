import PdfExport from '#models/pdf_export'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import factory from '@adonisjs/lucid/factories'

export const PdfExportFactory = factory
  .define(PdfExport, () => {
    return {
      userId: 0, // à surcharger
      organizationId: null, // à surcharger
      employeeId: 0, // à surcharger
      advisorUserId: null,
      status: PDF_EXPORT_STATUSES.PENDING,
      errorMessage: null,
      filePath: null,
      fileName: null,
      mimeType: null,
      size: null,
      startedAt: null,
      finishedAt: null,
    }
  })
  .build()
