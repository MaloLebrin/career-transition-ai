import { USERS_ROLES } from '#shared/constants/user'
import transmit from '@adonisjs/transmit/services/main'

// User-specific bulk jobs channel: users/:id/bulk-jobs
transmit.authorize<{ id: string }>('users/:id/bulk-jobs', (ctx, { id }) => {
  const user = ctx.auth.user
  if (!user) return false
  if (user.role === USERS_ROLES.SUPER_ADMIN) return true
  return user.id === Number(id)
})

// Organization bulk jobs channel: organizations/:orgId/bulk-jobs
transmit.authorize<{ orgId: string }>('organizations/:orgId/bulk-jobs', (ctx, { orgId }) => {
  const user = ctx.auth.user
  if (!user) return false
  if (user.role === USERS_ROLES.SUPER_ADMIN) return true
  return user.organizationId === Number(orgId)
})
