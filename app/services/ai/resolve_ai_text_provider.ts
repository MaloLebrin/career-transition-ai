import type { AiTextCompletionProvider } from '#services/ai/ai_text_completion_provider'
import { MistralTextProvider } from '#services/ai/mistral_text_provider'
import { NullAiTextProvider } from '#services/ai/null_ai_text_provider'
import { AI_PROVIDER_MODES, type AiProviderMode } from '#shared/constants/ai_provider'
import env from '#start/env'

export function resolveAiTextCompletionProvider(): AiTextCompletionProvider {
  const mode = (env.get('AI_PROVIDER') ?? AI_PROVIDER_MODES.NONE) as AiProviderMode

  switch (mode) {
    case AI_PROVIDER_MODES.MISTRAL:
      return new MistralTextProvider()
    case AI_PROVIDER_MODES.NONE:
    default:
      return new NullAiTextProvider()
  }
}
