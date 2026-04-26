import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const NotificationsController = () => import('#controllers/notifications_controller')

router
  .group(() => {
    router.patch('/notifications/:id/read', [NotificationsController, 'markAsRead'])
    router.patch('/notifications/read-all', [NotificationsController, 'markAllAsRead'])
  })
  .use([middleware.auth(), middleware.advisorOrAdmin()])
  .prefix('/dashboard')
