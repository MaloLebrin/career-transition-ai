import { QUEUE_NAMES } from '#utils/queues/queue_names'
import logger from '@adonisjs/core/services/logger'
import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'

interface LogExerciseUsageExportPayload {
  userId: number
  from: string
  to: string
  organizationId: number | null
}

export default class LogExerciseUsageExport extends Job<LogExerciseUsageExportPayload> {
  static options: JobOptions = {
    queue: QUEUE_NAMES.analytics,
    maxRetries: 3,
  }

  async execute() {
    const { userId, from, to, organizationId } = this.payload

    logger.info('Super admin requested exercise usage export', {
      userId,
      from,
      to,
      organizationId,
    })
  }
}
