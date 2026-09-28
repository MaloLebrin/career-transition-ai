import { SUPER_ADMIN_ASSIGNABLE_ROLES } from '#shared/constants/roles'
import vine from '@vinejs/vine'

/** Changement de rôle par le super admin : `super_admin` n’est jamais attribuable. */
export const updateUserRoleValidator = vine.create({
  role: vine.enum(SUPER_ADMIN_ASSIGNABLE_ROLES),
})
