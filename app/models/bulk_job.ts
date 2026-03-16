import type {
  BulkJobStatus,
  BulkJobType,
  BulkJobScope,
} from '#shared/constants/bulk_job'
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
