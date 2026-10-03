import { SUPER_ADMIN_CREATABLE_ROLES } from '#shared/constants/roles'
import vine from '@vinejs/vine'

/** Changement de rôle par le super admin : ni `super_admin` (#66) ni `employee` (#96). */
export const updateUserRoleValidator = vine.create({
  role: vine.enum(SUPER_ADMIN_CREATABLE_ROLES),
})
