import EmailVerificationController, {
  EMAIL_VERIFICATION_INVALID_MESSAGE,
  EMAIL_VERIFICATION_SENT_MESSAGE,
  EMAIL_VERIFIED_MESSAGE,
} from '#controllers/email_verification_controller'
import type { EmailVerificationService } from '#services/email_verification_service'
import { test } from '@japa/runner'

/**
 * Contrôleur fin : il délègue au service et répond. Les parcours complets
 * (routes, middlewares, base) sont dans `tests/functional/auth/email_verification.spec.ts`.
 */
function makeCtx(authUser: { id: number; role: string } | undefined) {
  const flashes: Array<[string, string]> = []
  const calls = { back: 0, redirect: '' }
  return {
    flashes,
    calls,
    ctx: {
      params: { token: 'secret' },
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
      auth: {
        user: authUser,
        getUserOrFail: () => {
          if (!authUser) throw new Error('unauthenticated')
          return authUser
        },
      },
    } as any,
  }
}

function makeController(service: Partial<Record<keyof EmailVerificationService, unknown>>) {
  return new EmailVerificationController(service as unknown as EmailVerificationService)
}

test.group('EmailVerificationController.verify', () => {
  test('lien valide, invité : flash succès et retour sur la connexion', async ({ assert }) => {
    const received: string[] = []
    const controller = makeController({
      verify: async (token: string) => {
        received.push(token)
        return { id: 3 }
      },
    })
    const { ctx, flashes, calls } = makeCtx(undefined)

    await controller.verify(ctx)

    assert.deepEqual(received, ['secret'])
    assert.deepEqual(flashes, [['success', EMAIL_VERIFIED_MESSAGE]])
    assert.equal(calls.redirect, '/auth/login')
  })

  test('candidat connecté : retour sur /dashboard/candidat ; autre rôle : /dashboard', async ({
    assert,
  }) => {
    const controller = makeController({ verify: async () => ({ id: 3 }) })

    const candidate = makeCtx({ id: 3, role: 'employee' })
    await controller.verify(candidate.ctx)
    assert.equal(candidate.calls.redirect, '/dashboard/candidat')

    const advisor = makeCtx({ id: 9, role: 'advisor' })
    await controller.verify(advisor.ctx)
    assert.equal(advisor.calls.redirect, '/dashboard')
  })

  test('lien invalide : flash erreur, même destination', async ({ assert }) => {
    const controller = makeController({ verify: async () => null })
    const { ctx, flashes, calls } = makeCtx({ id: 3, role: 'employee' })

    await controller.verify(ctx)

    assert.deepEqual(flashes, [['error', EMAIL_VERIFICATION_INVALID_MESSAGE]])
    assert.equal(calls.redirect, '/dashboard/candidat')
  })
})

test.group('EmailVerificationController.resend', () => {
  test('délègue au service pour l’utilisateur connecté, flash succès et retour arrière', async ({
    assert,
  }) => {
    const resent: number[] = []
    const controller = makeController({
      resend: async (user: { id: number }) => {
        resent.push(user.id)
      },
    })
    const { ctx, flashes, calls } = makeCtx({ id: 3, role: 'employee' })

    await controller.resend(ctx)

    assert.deepEqual(resent, [3])
    assert.deepEqual(flashes, [['success', EMAIL_VERIFICATION_SENT_MESSAGE]])
    assert.equal(calls.back, 1)
  })
})
