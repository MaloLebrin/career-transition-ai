import Notification from '#models/notification'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class NotificationTransformer extends BaseTransformer<Notification> {
  toObject() {
    return {
      id: this.resource.id,
      type: this.resource.type,
      status: this.resource.status,
      title: this.resource.title,
      body: this.resource.body,
      meta: this.resource.meta,
      readAt: this.resource.readAt?.toISO() ?? null,
      createdAt: this.resource.createdAt.toISO(),
    }
  }
}
