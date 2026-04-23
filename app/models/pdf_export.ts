import { PDF_EXPORT_STATUSES, type PdfExportStatus } from '#shared/constants/pdf_export'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class PdfExport extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare organizationId: number | null

  @column()
  declare employeeId: number

  @column()
  declare advisorUserId: number | null

  @column()
  declare status: PdfExportStatus

  @column()
  declare errorMessage: string | null

  @column()
  declare filePath: string | null

  @column()
  declare fileName: string | null

  @column()
  declare mimeType: string | null

  @column()
  declare size: number | null

  @column.dateTime()
  declare startedAt: DateTime | null

  @column.dateTime()
  declare finishedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  static statuses = PDF_EXPORT_STATUSES
}

