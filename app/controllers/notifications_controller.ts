import { NotificationService } from '#services/notification_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Appelé par la cloche via `router.patch` (Inertia) : redirection vers la page
 * courante, qui rafraîchit les props partagées `notifications`.
 */
@inject()
export default class NotificationsController {
  constructor(private service: NotificationService) {}

  async markAsRead({ auth, params, response }: HttpContext) {
    await this.service.markAsRead(Number(params.id), auth.user!.id)
    return response.redirect().back()
  }

  async markAllAsRead({ auth, response }: HttpContext) {
    await this.service.markAllAsRead(auth.user!.id)
    return response.redirect().back()
  }
}
