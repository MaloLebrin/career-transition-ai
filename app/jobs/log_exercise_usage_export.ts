import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'
import logger from '@adonisjs/core/services/logger'

interface LogExerciseUsageExportPayload {
  userId: number
  from: string
  to: string
  organizationId: number | null
}

export default class LogExerciseUsageExport extends Job<LogExerciseUsageExportPayload> {
  static options: JobOptions = {
    queue: 'analytics',
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
