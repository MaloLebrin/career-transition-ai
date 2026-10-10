import { middleware } from '#start/kernel'
import { throttleChatMessage } from '#start/limiter'
import router from '@adonisjs/core/services/router'

const ChatController = () => import('#controllers/chat_controller')

/** Chat avec un expert : ouvert à tout candidat onboardé, payé ou non. */
router
  .group(() => {
    router.get('/chat', [ChatController, 'show']).as('candidat.chat.show')
    router
      .post('/chat/messages', [ChatController, 'store'])
      .use(throttleChatMessage)
      .as('candidat.chat.store')
    router.post('/chat/read', [ChatController, 'read']).as('candidat.chat.read')
  })
  .use([middleware.auth(), middleware.candidate(), middleware.checkOnboarding()])
  .prefix('/dashboard/candidat')
