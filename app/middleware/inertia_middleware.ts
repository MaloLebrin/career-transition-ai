import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'
import Employee from '#models/employee'
import { NotificationService } from '#services/notification_service'
import { receivesNotifications } from '#shared/helpers/roles'
import config from '@adonisjs/core/services/config'

export default class InertiaMiddleware extends BaseInertiaMiddleware {
  async share(ctx: HttpContext) {
    const { session, auth } = ctx as Partial<HttpContext>
    const request = ctx.request as typeof ctx.request & { csrfToken?: string }
    const user = auth?.user
    const userDto =
      user === undefined
        ? undefined
        : {
            id: user.id,
            organizationId: user.organizationId,
            email: user.email,
            name: user.name,
            role: user.role,
          }

    let employees: any[] = []
    if (user) {
      if (user.role === 'advisor') {
        employees = await Employee.query().where('advisorId', user.id).orderBy('name', 'asc')
      } else if (user.role === 'admin' || user.role === 'super_admin') {
        employees = await Employee.query()
          .where('organizationId', user.organizationId)
          .orderBy('name', 'asc')
      }
    }

    let notifications: any[] = []
    let unreadNotificationsCount = 0
    if (user && receivesNotifications(user.role)) {
      const notifService = new NotificationService()
      notifications = await notifService.getRecentForUser(user.id, 20)
      unreadNotificationsCount = notifications.filter((n: any) => n.status === 'unread').length
    }

    return {
      errors: ctx.inertia.always(this.getValidationErrors(ctx)),
      flash: ctx.inertia.always({
        error: session?.flashMessages.get('error'),
        success: session?.flashMessages.get('success'),
      }),
      user: ctx.inertia.always(userDto),
      employees: ctx.inertia.always(employees),
      csrfToken: request.csrfToken,
      notifications: ctx.inertia.always(notifications),
      unreadNotificationsCount: ctx.inertia.always(unreadNotificationsCount),
      // Masque le lien d'inscription quand /auth/register est fermé.
      registrationEnabled: config.get<boolean>('registration.enabled'),
    }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx)
    const output = await next()
    this.dispose(ctx)
    return output
  }
}
