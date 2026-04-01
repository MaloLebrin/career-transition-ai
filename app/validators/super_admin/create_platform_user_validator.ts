import vine from '@vinejs/vine'

/** Rôles qu’un super admin peut attribuer à la création (pas de super_admin). */
export const superAdminCreatableUserRoles = ['advisor', 'admin', 'expert', 'employee'] as const

export type SuperAdminCreatableUserRole = (typeof superAdminCreatableUserRoles)[number]

export const createPlatformUserValidator = vine.create({
  organizationId: vine.number().positive(),
  name: vine.string().trim().minLength(1).maxLength(255),
  email: vine.string().trim().email().maxLength(255),
  role: vine.enum(superAdminCreatableUserRoles),
})
