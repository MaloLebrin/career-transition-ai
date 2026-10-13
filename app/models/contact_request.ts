import {
  CONTACT_REQUEST_STATUSES,
  CONTACT_REQUEST_TYPES,
  type ContactRequestStatus,
  type ContactRequestType,
} from '#shared/constants/contact_request'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export {
  CONTACT_REQUEST_STATUSES,
  CONTACT_REQUEST_TYPES,
  type ContactRequestStatus,
  type ContactRequestType,
}

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
