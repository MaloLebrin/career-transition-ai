import type { AiClient } from '#shared/helpers/ai/ai_client'
import { AI_PROVIDER_MODES, type AiProviderMode } from '#shared/constants/ai_provider'
import env from '#start/env'
import { Mistral } from '@mistralai/mistralai'

/**
 * Client IA des endpoints `/dashboard/ai/*` (import de CV, suggestions). La clé
 * `MISTRAL_API_KEY` ne quitte jamais le serveur (issue #18 : elle était
 * auparavant embarquée dans le bundle via `VITE_MISTRAL_API_KEY`).
 */

const DEFAULT_CHAT_MODEL = 'mistral-small-latest'
const OCR_MODEL = 'mistral-ocr-latest'

/** Sous-ensemble du SDK Mistral utilisé ici (remplaçable en test). */
export interface MistralLike {
  chat: Pick<Mistral['chat'], 'complete'>
  ocr: Pick<Mistral['ocr'], 'process'>
}

export const NULL_AI_CLIENT: AiClient = {
  provider: 'none',
  completeText: async () => null,
  completeJson: async () => null,
}

export function parseJsonOrNull(text: unknown): any | null {
  if (typeof text !== 'string') return null
  const trimmed = text.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

export function createMistralAiClient(client: MistralLike, chatModel: string): AiClient {
  async function complete(prompt: string, temperature: number) {
    const response = await client.chat.complete({
      model: chatModel,
      temperature,
      messages: [{ role: 'user', content: prompt }],
    })
    const content = response.choices?.[0]?.message?.content
    return typeof content === 'string' ? content : null
  }

  return {
    provider: 'mistral',
    completeText: (prompt, options) => complete(prompt, options?.temperature ?? 0.7),
    completeJson: async (prompt, options) =>
      parseJsonOrNull(await complete(prompt, options?.temperature ?? 0.4)),
    ocrToMarkdown: async ({ base64, mimeType }) => {
      const dataUrl = `data:${mimeType};base64,${base64}`
      const response = await client.ocr.process({
        model: OCR_MODEL,
        document: mimeType.startsWith('image/')
          ? { type: 'image_url', imageUrl: dataUrl }
          : { type: 'document_url', documentUrl: dataUrl },
      })
      const markdown = (response.pages ?? [])
        .map((page) => page.markdown)
        .filter(Boolean)
        .join('\n\n')
        .trim()
      return markdown || null
    },
  }
}

/** Client selon `AI_PROVIDER` ; client inerte si IA désactivée ou clé absente. */
export function createServerAiClient(): AiClient {
  const mode = (env.get('AI_PROVIDER') ?? AI_PROVIDER_MODES.NONE) as AiProviderMode
  const apiKey = env.get('MISTRAL_API_KEY')
  if (mode !== AI_PROVIDER_MODES.MISTRAL || !apiKey) return NULL_AI_CLIENT

  return createMistralAiClient(
    new Mistral({ apiKey }),
    env.get('MISTRAL_MODEL') ?? DEFAULT_CHAT_MODEL
  )
}
