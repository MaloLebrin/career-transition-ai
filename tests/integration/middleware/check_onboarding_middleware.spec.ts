import { test } from '@japa/runner'
import CheckOnboardingMiddleware from '#middleware/check_onboarding_middleware'
import { makeCtx, makeNext } from '#tests/support/http_context'
import { createAdvisor, createCandidate, createUser } from '#tests/support/actors'
import { USERS_ROLES } from '#shared/types/advisor/roles'

test.group('CheckOnboardingMiddleware', () => {
  test('laisse passer un candidat dont la fiche est onboardée', async ({ assert }) => {
    const { user } = await createCandidate({ onboarded: true })
    const { ctx, redirects, unauthorized } = makeCtx({ user })
    const { next, calls } = makeNext()

    await new CheckOnboardingMiddleware().handle(ctx, next)

    assert.equal(calls.count, 1)
    assert.deepEqual(redirects, [])
    assert.deepEqual(unauthorized, [])
  })

  test("redirige un candidat non onboardé vers la page d'onboarding", async ({ assert }) => {
    const { user } = await createCandidate({ onboarded: false })
    const { ctx, redirects } = makeCtx({ user })
    const { next, calls } = makeNext()

    await new CheckOnboardingMiddleware().handle(ctx, next)

    assert.equal(calls.count, 0)
    assert.deepEqual(redirects, ['/dashboard/candidat/onboarding'])
  })

  test('répond 401 à un candidat sans fiche Employee', async ({ assert }) => {
    const user = await createUser(USERS_ROLES.EMPLOYEE)
    const { ctx, unauthorized, redirects } = makeCtx({ user })
    const { next, calls } = makeNext()

    await new CheckOnboardingMiddleware().handle(ctx, next)

    assert.equal(calls.count, 0)
    assert.lengthOf(unauthorized, 1)
    assert.deepEqual(redirects, [])
  })

  test("ignore un utilisateur qui n'est pas candidat", async ({ assert }) => {
    const advisor = await createAdvisor()
    const { ctx, unauthorized, redirects } = makeCtx({ user: advisor })
    const { next, calls } = makeNext()

    await new CheckOnboardingMiddleware().handle(ctx, next)

    assert.equal(calls.count, 1)
    assert.deepEqual(unauthorized, [])
    assert.deepEqual(redirects, [])
  })

  test('ignore une requête sans utilisateur', async ({ assert }) => {
    const { ctx } = makeCtx()
    const { next, calls } = makeNext()

    await new CheckOnboardingMiddleware().handle(ctx, next)

    assert.equal(calls.count, 1)
  })
})
