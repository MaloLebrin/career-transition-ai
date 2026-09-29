import PasswordsController, {
  FORGOT_PASSWORD_SENT_MESSAGE,
} from '#controllers/passwords_controller'
import type { PasswordsService } from '#services/passwords_service'
import { test } from '@japa/runner'

/**
 * Contrôleur fin : il délègue au service et répond. Les parcours complets
 * (routes, middlewares, base) sont dans `tests/functional/auth/password_reset.spec.ts`.
 */
function makeCtx(payload: Record<string, unknown> = {}) {
  const flashes: Array<[string, string]> = []
  const calls = { back: 0, redirect: '' }
  return {
    flashes,
    calls,
    ctx: {
      params: { token: 'secret', id: '7' },
      request: { validateUsing: async () => payload },
      session: { flash: (key: string, value: string) => flashes.push([key, value]) },
      response: {
        redirect(url?: string) {
          if (url) {
            calls.redirect = url
            return this
          }
          return {
            back: () => {
              calls.back++
            },
          }
        },
      },
      auth: { getUserOrFail: () => ({ id: 1 }) },
    } as any,
  }
}

test.group('PasswordsController', () => {
  test('sendForgot répond le même message, que le compte existe ou non', async ({ assert }) => {
    const requested: string[] = []
    const service = { requestReset: async (email: string) => requested.push(email) }
    const controller = new PasswordsController(service as unknown as PasswordsService)
    const { ctx, flashes, calls } = makeCtx({ email: 'a@example.com' })

    await controller.sendForgot(ctx)

    assert.deepEqual(requested, ['a@example.com'])
    assert.deepEqual(flashes, [['success', FORGOT_PASSWORD_SENT_MESSAGE]])
    assert.equal(calls.back, 1)
  })

  test('update transmet le mot de passe actuel et le nouveau', async ({ assert }) => {
    const received: unknown[] = []
    const service = { change: async (...args: unknown[]) => received.push(args) }
    const controller = new PasswordsController(service as unknown as PasswordsService)
    const { ctx, flashes } = makeCtx({
      current_password: 'ancien',
      password: 'nouveau-mdp',
      password_confirmation: 'nouveau-mdp',
    })

    await controller.update(ctx)

    assert.deepEqual(received, [
      [{ id: 1 }, { currentPassword: 'ancien', password: 'nouveau-mdp' }],
    ])
    assert.deepEqual(flashes, [['success', 'Mot de passe modifié.']])
  })

  test('sendResetLink annonce l’envoi du lien, sans aucun mot de passe', async ({ assert }) => {
    const service = { sendResetLinkTo: async (id: number) => ({ id, name: 'Olivia' }) }
    const controller = new PasswordsController(service as unknown as PasswordsService)
    const { ctx, flashes } = makeCtx()

    await controller.sendResetLink(ctx)

    assert.deepEqual(flashes, [['success', 'Lien de réinitialisation envoyé à Olivia.']])
  })
})
