import { ORGANIZATION_TEAM_ROLES } from '#shared/constants/organisation'
import vine from '@vinejs/vine'

export const inviteAdvisorValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
  email: vine.string().trim().email().maxLength(255),
  role: vine.enum(ORGANIZATION_TEAM_ROLES),
})
