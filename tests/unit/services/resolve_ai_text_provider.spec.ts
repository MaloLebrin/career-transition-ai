import { NullAiTextProvider } from '#integrations/ai/null_ai_text_provider'
import { resolveAiTextCompletionProvider } from '#integrations/ai/resolve_ai_text_provider'
import { test } from '@japa/runner'

test.group('resolveAiTextCompletionProvider', () => {
  test('uses Null provider when AI_PROVIDER is none (test .env)', ({ assert }) => {
    assert.instanceOf(resolveAiTextCompletionProvider(), NullAiTextProvider)
  })
})
