import { test } from '@japa/runner'
import NotificationsController from '#controllers/notifications_controller'

/**
 * Unit — `NotificationsController` : `NotificationService` factice injecté par le
 * constructeur. Le service scope toujours la mise à jour par `userId` : une
 * notification d'un autre utilisateur n'est simplement pas modifiée.
 */

const USER = { id: 14 }

class FakeNotificationService {
  public markAsReadCalls: Array<{ notificationId: number; userId: number }> = []
  public markAllAsReadCalls: number[] = []
  public error: Error | null = null

  async markAsRead(notificationId: number, userId: number) {
    this.markAsReadCalls.push({ notificationId, userId })
    if (this.error) throw this.error
  }

  async markAllAsRead(userId: number) {
    this.markAllAsReadCalls.push(userId)
    if (this.error) throw this.error
  }
}

function makeResponse() {
  return {
    noContentCalled: false,
    noContent() {
      this.noContentCalled = true
    },
  }
}

test.group('NotificationsController.markAsRead', () => {
  test("marque la notification comme lue pour l'utilisateur connecté (204)", async ({ assert }) => {
    const service = new FakeNotificationService()
    const controller = new NotificationsController(service as any)
    const response = makeResponse()

    await controller.markAsRead({ auth: { user: USER }, params: { id: '8' }, response } as any)

    assert.deepEqual(service.markAsReadCalls, [{ notificationId: 8, userId: USER.id }])
    assert.isTrue(response.noContentCalled)
  })

  test("propage l'erreur du service sans répondre 204", async ({ assert }) => {
    const service = new FakeNotificationService()
    service.error = new Error('db down')
    const controller = new NotificationsController(service as any)
    const response = makeResponse()

    await assert.rejects(
      () => controller.markAsRead({ auth: { user: USER }, params: { id: '8' }, response } as any),
      'db down'
    )
    assert.isFalse(response.noContentCalled)
  })
})

test.group('NotificationsController.markAllAsRead', () => {
  test("marque toutes les notifications de l'utilisateur connecté (204)", async ({ assert }) => {
    const service = new FakeNotificationService()
    const controller = new NotificationsController(service as any)
    const response = makeResponse()

    await controller.markAllAsRead({ auth: { user: USER }, response } as any)

    assert.deepEqual(service.markAllAsReadCalls, [USER.id])
    assert.isTrue(response.noContentCalled)
  })

  test("propage l'erreur du service sans répondre 204", async ({ assert }) => {
    const service = new FakeNotificationService()
    service.error = new Error('db down')
    const controller = new NotificationsController(service as any)
    const response = makeResponse()

    await assert.rejects(
      () => controller.markAllAsRead({ auth: { user: USER }, response } as any),
      'db down'
    )
    assert.isFalse(response.noContentCalled)
  })
})
