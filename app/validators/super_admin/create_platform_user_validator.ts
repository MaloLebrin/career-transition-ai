import { SUPER_ADMIN_ASSIGNABLE_ROLES } from '#shared/constants/roles'
import vine from '@vinejs/vine'

export const createPlatformUserValidator = vine.create({
  organizationId: vine.number().positive().exists({ table: 'organizations', column: 'id' }),
  name: vine.string().trim().minLength(1).maxLength(255),
  email: vine.string().trim().email().maxLength(255),
  role: vine.enum(SUPER_ADMIN_ASSIGNABLE_ROLES),
})
