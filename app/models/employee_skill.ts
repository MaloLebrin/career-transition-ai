import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class EmployeeSkill extends BaseModel {
  static table = 'employee_skills'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare employeeId: number

  @column()
  declare skillId: number

  @column()
  declare level: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
