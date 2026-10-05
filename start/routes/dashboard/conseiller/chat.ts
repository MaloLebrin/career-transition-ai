import { middleware } from '#start/kernel'
import { throttleChatMessage } from '#start/limiter'
import router from '@adonisjs/core/services/router'

const ExpertChatController = () => import('#controllers/expert_chat_controller')

/** Messagerie de l'équipe d'experts (le service refuse les membres d'un cabinet client). */
router
  .group(() => {
    router.get('/chat', [ExpertChatController, 'index']).as('conseiller.chat.index')
    router
      .get('/chat/:id', [ExpertChatController, 'show'])
      .where('id', router.matchers.number())
      .as('conseiller.chat.show')
    router
      .post('/chat/:id/messages', [ExpertChatController, 'store'])
      .where('id', router.matchers.number())
      .use(throttleChatMessage)
      .as('conseiller.chat.store')
    router
      .post('/chat/:id/claim', [ExpertChatController, 'claim'])
      .where('id', router.matchers.number())
      .as('conseiller.chat.claim')
    router
      .post('/chat/:id/read', [ExpertChatController, 'read'])
      .where('id', router.matchers.number())
      .as('conseiller.chat.read')
  })
  .use([middleware.auth(), middleware.advisorOrAdmin()])
  .prefix('/dashboard/conseiller')
