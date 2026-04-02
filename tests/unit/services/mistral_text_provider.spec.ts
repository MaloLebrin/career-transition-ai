import { MistralTextProvider } from '#services/ai/mistral_text_provider'
import env from '#start/env'
import { test } from '@japa/runner'

test.group('MistralTextProvider', () => {
  test('throws when MISTRAL_API_KEY is missing', async ({ assert }) => {
    const original = env.get
    env.get = ((key: any) => {
      if (key === 'MISTRAL_API_KEY') return undefined
      return original.call(env, key)
    }) as any

    try {
      const provider = new MistralTextProvider()
      await assert.rejects(() => provider.completeText('hello'), 'MISTRAL_API_KEY manquante')
    } finally {
      env.get = original
    }
  })
})

