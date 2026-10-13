import { test } from '@japa/runner'
import { denyAccess, wantsPage } from '#utils/forbidden_response'
import { makeCtx } from '#tests/support/http_context'

const MESSAGE = 'Accès réservé aux administrateurs.'

test.group('forbidden_response | wantsPage', () => {
  test('vrai pour une visite Inertia', ({ assert }) => {
    const { ctx } = makeCtx({ headers: { 'x-inertia': 'true' } })
    assert.isTrue(wantsPage(ctx))
  })

  test('vrai pour une navigation du navigateur', ({ assert }) => {
    const { ctx } = makeCtx({ headers: { accept: 'text/html,application/xhtml+xml' } })
    assert.isTrue(wantsPage(ctx))
  })

  test('faux pour un client JSON ou sans en-tête', ({ assert }) => {
    assert.isFalse(wantsPage(makeCtx({ headers: { accept: 'application/json' } }).ctx))
    assert.isFalse(wantsPage(makeCtx().ctx))
  })
})

test.group('forbidden_response | denyAccess', () => {
  test('rend la page errors/forbidden en 403 pour une visite Inertia', async ({ assert }) => {
    const { ctx, statuses, sent, rendered, forbidden } = makeCtx({
      headers: { 'x-inertia': 'true' },
    })

    await denyAccess(ctx, MESSAGE)

    assert.deepEqual(statuses, [403])
    assert.deepEqual(sent, ['inertia:errors/forbidden'])
    assert.deepEqual(rendered, [{ component: 'errors/forbidden', props: { message: MESSAGE } }])
    assert.deepEqual(forbidden, [])
  })

  test('répond en JSON { message } pour un client sans page', async ({ assert }) => {
    const { ctx, rendered, forbidden } = makeCtx()

    await denyAccess(ctx, MESSAGE)

    assert.deepEqual(forbidden, [{ message: MESSAGE }])
    assert.deepEqual(rendered, [])
  })
})
