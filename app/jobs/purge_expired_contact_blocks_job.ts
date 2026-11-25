import { ContactBlocklistService } from '#services/contact_blocklist_service'
import { CONTACT_BLOCK_RETENTION_YEARS } from '#shared/constants/contact_request'
import { QUEUE_NAMES } from '#utils/queues/queue_names'
import logger from '@adonisjs/core/services/logger'
import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'
import { DateTime } from 'luxon'

type PurgeExpiredContactBlocksPayload = {
  retentionYears?: number
}

/**
 * Lève les blocages d'adresses du formulaire de contact posés il y a plus de
 * `CONTACT_BLOCK_RETENTION_YEARS` ans (planifié chaque nuit dans `start/scheduler.ts`) :
 * une adresse e-mail n'est pas conservée sans limite (`docs/RGPD.md`).
 */
export default class PurgeExpiredContactBlocksJob extends Job<PurgeExpiredContactBlocksPayload> {
  static options: JobOptions = {
    queue: QUEUE_NAMES.default,
    maxRetries: 1,
  }

  async execute() {
    const retentionYears = this.payload.retentionYears ?? CONTACT_BLOCK_RETENTION_YEARS
    const purged = await new ContactBlocklistService().purgeExpired(
      DateTime.now().minus({ years: retentionYears })
    )
    logger.info({ purged, retentionYears }, 'Expired contact blocks purged')
  }
}
