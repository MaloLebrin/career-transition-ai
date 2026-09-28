import { appUrl } from '#utils/app_url'
import { withEnv } from '#tests/utils/env'
import { test } from '@japa/runner'

test.group('appUrl', () => {
  test('renvoie APP_URL sans / final', async ({ assert }) => {
    await withEnv({ APP_URL: 'https://app.example.fr/' }, () => {
      assert.equal(appUrl(), 'https://app.example.fr')
    })
  })

  test('ajoute le chemin avec un seul /', async ({ assert }) => {
    await withEnv({ APP_URL: 'https://app.example.fr//' }, () => {
      assert.equal(appUrl('/onboarding/abc'), 'https://app.example.fr/onboarding/abc')
      assert.equal(appUrl('onboarding/abc'), 'https://app.example.fr/onboarding/abc')
    })
  })

  test('garde le port et le sous-chemin', async ({ assert }) => {
    await withEnv({ APP_URL: 'http://localhost:3333/app' }, () => {
      assert.equal(appUrl('/x'), 'http://localhost:3333/app/x')
    })
  })
})
