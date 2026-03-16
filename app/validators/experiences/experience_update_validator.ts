import { experiencesTypesValues } from '#shared/constants/experience'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

export const experienceUpdateValidator = vine.create({
  id: vine.number(),
  title: vine.string().trim().minLength(1).maxLength(255),
  company: vine.string().trim().maxLength(255),
  type: vine.enum(experiencesTypesValues),
  startDate: vine
    .date()
    .before('today')
    .transform((value) => DateTime.fromJSDate(value)),
  endDate: vine
    .date()
    .afterField('startDate')
    .nullable()
    .transform((value) => (value ? DateTime.fromJSDate(value) : null)),
  isCurrent: vine.boolean().nullable(),
  description: vine.string().trim().maxLength(5000).nullable(),
})
