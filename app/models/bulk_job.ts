import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class BulkJob extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare organizationId: number | null

  @column()
  declare type: BulkJobType

  @column()
  declare scope: BulkJobScope

  @column()
  declare status: BulkJobStatus

  @column()
  declare queueJobId: string | null

  @column()
  declare errorMessage: string | null

  @column()
  declare meta: Record<string, unknown> | null

  @column.dateTime()
  declare startedAt: DateTime | null

  @column.dateTime()
  declare finishedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

export const BULK_JOB_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type BulkJobStatus = (typeof BULK_JOB_STATUSES)[keyof typeof BULK_JOB_STATUSES]

export const BULK_JOB_TYPES = {
  EMAILS: 'emails',
  PDFS: 'pdfs',
  MIXED: 'mixed',
} as const

export type BulkJobType = (typeof BULK_JOB_TYPES)[keyof typeof BULK_JOB_TYPES]

export const BULK_JOB_SCOPES = {
  SINGLE: 'single',
  BATCH: 'batch',
  ORG: 'org',
} as const

export type BulkJobScope = (typeof BULK_JOB_SCOPES)[keyof typeof BULK_JOB_SCOPES]
