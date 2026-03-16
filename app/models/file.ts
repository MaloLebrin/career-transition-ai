import type { FileType } from '#shared/constants/file'
import Employee from '#models/employee'
import Organization from '#models/organization'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class File extends BaseModel {
  // TODO: configure the file driver
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare organizationId: number

  @column()
  declare employeeId: number

  @column()
  declare type: FileType

  @column()
  declare name: string

  @column()
  declare path: string

  @column()
  declare mimeType: string | null

  @column()
  declare size: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Organization)
  declare organization: BelongsTo<typeof Organization>

  @belongsTo(() => Employee)
  declare employee: BelongsTo<typeof Employee>
}
