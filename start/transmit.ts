import { ChatService } from '#services/chat_service'
import { CHAT_CHANNEL_PATTERN } from '#shared/constants/chat'
import app from '@adonisjs/core/services/app'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { canSubscribeToOrganizationPdfExports } from '#utils/transmit_authorization'
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
  return canSubscribeToOrganizationPdfExports(user, orgId)
})

// User-specific notifications channel: users/:id/notifications
transmit.authorize<{ id: string }>('users/:id/notifications', (ctx, { id }) => {
  const user = ctx.auth.user
  if (!user) return false
  if (user.role === USERS_ROLES.SUPER_ADMIN) return true
  return user.id === Number(id)
})

// Chat candidat ↔ expert : chat/conversations/:id (candidat propriétaire, expert responsable ou file, admin)
transmit.authorize<{ id: string }>(CHAT_CHANNEL_PATTERN, async (ctx, { id }) => {
  const chat = await app.container.make(ChatService)
  return chat.canSubscribe(ctx.auth.user, Number(id))
})
