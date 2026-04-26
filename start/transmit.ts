import { USERS_ROLES } from '#shared/types/advisor/roles'
import transmit from '@adonisjs/transmit/services/main'

// User-specific pdf exports channel: users/:id/pdf-exports
transmit.authorize<{ id: string }>('users/:id/pdf-exports', (ctx, { id }) => {
  const user = ctx.auth.user
  if (!user) return false
  if (user.role === USERS_ROLES.SUPER_ADMIN) return true
  return user.id === Number(id)
})

// Organization pdf exports channel: organizations/:orgId/pdf-exports
transmit.authorize<{ orgId: string }>('organizations/:orgId/pdf-exports', (ctx, { orgId }) => {
  const user = ctx.auth.user
  if (!user) return false
  if (user.role === USERS_ROLES.SUPER_ADMIN) return true
  return user.organizationId === Number(orgId)
})

// User-specific notifications channel: users/:id/notifications
transmit.authorize<{ id: string }>('users/:id/notifications', (ctx, { id }) => {
  const user = ctx.auth.user
  if (!user) return false
  if (user.role === USERS_ROLES.SUPER_ADMIN) return true
  return user.id === Number(id)
})
