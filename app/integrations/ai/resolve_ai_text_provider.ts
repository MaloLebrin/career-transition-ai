import type { AiTextCompletionProvider } from '#integrations/ai/ai_text_completion_provider'
import { GeminiTextProvider } from '#integrations/ai/gemini_text_provider'
import { NullAiTextProvider } from '#integrations/ai/null_ai_text_provider'
import { OpenAiTextProvider } from '#integrations/ai/openai_text_provider'
import { AI_PROVIDER_MODES, type AiProviderMode } from '#shared/constants/ai_provider'
import env from '#start/env'

export function resolveAiTextCompletionProvider(): AiTextCompletionProvider {
  const mode = (env.get('AI_PROVIDER') ?? AI_PROVIDER_MODES.NONE) as AiProviderMode

  switch (mode) {
    case AI_PROVIDER_MODES.OPENAI:
      return new OpenAiTextProvider()
    case AI_PROVIDER_MODES.GEMINI:
      return new GeminiTextProvider()
    case AI_PROVIDER_MODES.NONE:
    default:
      return new NullAiTextProvider()
  }
}

