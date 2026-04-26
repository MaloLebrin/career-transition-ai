import { NotificationService } from '#services/notification_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class NotificationsController {
  constructor(private service: NotificationService) {}

  async markAsRead({ auth, params, response }: HttpContext) {
    await this.service.markAsRead(Number(params.id), auth.user!.id)
    return response.noContent()
  }

  async markAllAsRead({ auth, response }: HttpContext) {
    await this.service.markAllAsRead(auth.user!.id)
    return response.noContent()
  }
}
