import { ORGANIZATION_TEAM_ROLES } from '#shared/constants/organisation'
import vine from '@vinejs/vine'

export const updateMemberRoleValidator = vine.create({
  role: vine.enum(ORGANIZATION_TEAM_ROLES),
})

export const reassignCandidatesValidator = vine.create({
  toUserId: vine.number().positive(),
})
