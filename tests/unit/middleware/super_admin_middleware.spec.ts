import { test } from '@japa/runner'
import SuperAdminMiddleware from '#middleware/super_admin_middleware'

function makeCtx(authUser: { id: number; role: string } | null) {
  let nextCalled = false
  const response = {
    forbiddenPayload: null as any,
    forbidden(payload: any) {
      this.forbiddenPayload = payload
      return this
    },
  }
  return {
    auth: { user: authUser },
    response,
    async next() {
      nextCalled = true
    },
    get nextCalled() {
      return nextCalled
    },
  } as any
}

test.group('SuperAdminMiddleware', () => {
  test('calls next when user is super_admin', async ({ assert }) => {
    const middleware = new SuperAdminMiddleware()
    const ctx = makeCtx({ id: 1, role: 'super_admin' })

    await middleware.handle(ctx, ctx.next)

    assert.isTrue(ctx.nextCalled)
    assert.isNull(ctx.response.forbiddenPayload)
  })

  test('returns forbidden when user is missing', async ({ assert }) => {
    const middleware = new SuperAdminMiddleware()
    const ctx = makeCtx(null)

    await middleware.handle(ctx, ctx.next)

    assert.isFalse(ctx.nextCalled)
    assert.deepEqual(ctx.response.forbiddenPayload, {
      message: 'Accès réservé aux super administrateurs.',
    })
  })

  test('returns forbidden when user is not super_admin', async ({ assert }) => {
    const middleware = new SuperAdminMiddleware()
    const ctx = makeCtx({ id: 1, role: 'admin' })

    await middleware.handle(ctx, ctx.next)

    assert.isFalse(ctx.nextCalled)
    assert.deepEqual(ctx.response.forbiddenPayload, {
      message: 'Accès réservé aux super administrateurs.',
    })
  })
})
