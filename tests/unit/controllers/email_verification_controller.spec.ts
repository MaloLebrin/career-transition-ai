import EmailVerificationController, {
  EMAIL_CHANGE_TAKEN_MESSAGE,
  EMAIL_CHANGED_MESSAGE,
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
        return { outcome: 'verified' }
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
    const controller = makeController({ verify: async () => ({ outcome: 'verified' }) })

    const candidate = makeCtx({ id: 3, role: 'employee' })
    await controller.verify(candidate.ctx)
    assert.equal(candidate.calls.redirect, '/dashboard/candidat')

    const advisor = makeCtx({ id: 9, role: 'advisor' })
    await controller.verify(advisor.ctx)
    assert.equal(advisor.calls.redirect, '/dashboard')
  })

  test('lien invalide : flash erreur, même destination', async ({ assert }) => {
    const controller = makeController({ verify: async () => ({ outcome: 'invalid' }) })
    const { ctx, flashes, calls } = makeCtx({ id: 3, role: 'employee' })

    await controller.verify(ctx)

    assert.deepEqual(flashes, [['error', EMAIL_VERIFICATION_INVALID_MESSAGE]])
    assert.equal(calls.redirect, '/dashboard/candidat')
  })

  test('changement d’e-mail (#143) : succès ou adresse prise entre-temps', async ({ assert }) => {
    const changed = makeCtx({ id: 9, role: 'advisor' })
    await makeController({ verify: async () => ({ outcome: 'email_changed' }) }).verify(changed.ctx)
    assert.deepEqual(changed.flashes, [['success', EMAIL_CHANGED_MESSAGE]])
    assert.equal(changed.calls.redirect, '/dashboard')

    const taken = makeCtx(undefined)
    await makeController({ verify: async () => ({ outcome: 'email_taken' }) }).verify(taken.ctx)
    assert.deepEqual(taken.flashes, [['error', EMAIL_CHANGE_TAKEN_MESSAGE]])
    assert.equal(taken.calls.redirect, '/auth/login')
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
