import vine from '@vinejs/vine'

/**
 * Payload for POST /dashboard/employee/profile/experiences (user + linked employee fields).
 */
export const experienceCreateValidator = vine.create({
  title: vine.string().trim().minLength(1).maxLength(255),
  company: vine.string().trim().maxLength(255),
  startDate: vine.date().before('today'),
  endDate: vine.date().before('today').afterField('startDate').nullable(),
  isCurrent: vine.boolean().nullable(),
  description: vine.string().trim().maxLength(5000).nullable(),
})
