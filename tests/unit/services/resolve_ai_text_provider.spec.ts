import { MistralTextProvider } from '#services/ai/mistral_text_provider'
import { NullAiTextProvider } from '#services/ai/null_ai_text_provider'
import { resolveAiTextCompletionProvider } from '#services/ai/resolve_ai_text_provider'
import env from '#start/env'
import { test } from '@japa/runner'

test.group('resolveAiTextCompletionProvider', () => {
  test('uses Mistral provider when AI_PROVIDER is mistral', ({ assert }) => {
    const original = env.get
    env.get = ((key: any) => {
      if (key === 'AI_PROVIDER') return 'mistral'
      return original.call(env, key)
    }) as any
    try {
      assert.instanceOf(resolveAiTextCompletionProvider(), MistralTextProvider)
    } finally {
      env.get = original
    }
  })

  test('uses Null provider when AI_PROVIDER is none (test .env)', ({ assert }) => {
    assert.instanceOf(resolveAiTextCompletionProvider(), NullAiTextProvider)
  })
})
