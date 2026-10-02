import { PLATFORM_TEAM_ROLES } from '#shared/constants/roles'
import vine from '@vinejs/vine'

/** Invitation d'un membre de l'équipe interne (#105) : jamais `employee` ni `super_admin`. */
export const invitePlatformMemberValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
  email: vine.string().trim().email().maxLength(255),
  role: vine.enum(PLATFORM_TEAM_ROLES),
})
