import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

export const createEducationValidator = vine.create({
  degree: vine.string().trim().minLength(1).maxLength(255),
  school: vine.string().trim().minLength(1).maxLength(255),
  startDate: vine
    .date()
    .before('today')
    .transform((value) => DateTime.fromJSDate(value)),
  endDate: vine
    .date()
    .afterField('startDate')
    .nullable()
    .transform((value) => (value ? DateTime.fromJSDate(value) : null)),
  isCurrent: vine.boolean().optional(),
  description: vine.string().trim().maxLength(5000).optional(),
  sortOrder: vine.number().optional(),
})
