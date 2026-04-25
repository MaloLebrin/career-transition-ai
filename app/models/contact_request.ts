import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export const CONTACT_REQUEST_TYPES = {
  CONTACT: 'contact',
  DEMO: 'demo',
} as const
export type ContactRequestType = (typeof CONTACT_REQUEST_TYPES)[keyof typeof CONTACT_REQUEST_TYPES]

export const CONTACT_REQUEST_STATUSES = {
  PENDING: 'pending',
  TREATED: 'treated',
  ARCHIVED: 'archived',
} as const
export type ContactRequestStatus =
  (typeof CONTACT_REQUEST_STATUSES)[keyof typeof CONTACT_REQUEST_STATUSES]

export default class ContactRequest extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare email: string

  @column()
  declare phone: string | null

  @column()
  declare organization: string | null

  @column()
  declare message: string

  @column()
  declare type: ContactRequestType

  @column()
  declare status: ContactRequestStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
