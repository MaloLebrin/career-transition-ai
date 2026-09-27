import { purgeExpiredPdfExports } from '#services/pdf_storage_service'
import { PDF_EXPORT_RETENTION_DAYS } from '#shared/constants/pdf_export'
import { QUEUE_NAMES } from '#utils/queues/queue_names'
import logger from '@adonisjs/core/services/logger'
import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'
import { DateTime } from 'luxon'

type PurgeExpiredPdfExportsPayload = {
  retentionDays?: number
}

/**
 * Supprime les PDF générés il y a plus de `PDF_EXPORT_RETENTION_DAYS` jours
 * (planifié chaque nuit dans `start/scheduler.ts`), issue #21.
 */
export default class PurgeExpiredPdfExportsJob extends Job<PurgeExpiredPdfExportsPayload> {
  static options: JobOptions = {
    queue: QUEUE_NAMES.pdfs,
    maxRetries: 1,
  }

  async execute() {
    const retentionDays = this.payload.retentionDays ?? PDF_EXPORT_RETENTION_DAYS
    const purged = await purgeExpiredPdfExports(DateTime.now().minus({ days: retentionDays }))
    logger.info({ purged, retentionDays }, 'Expired PDF exports purged')
  }
}
