import { Mistral } from '@mistralai/mistralai'
import type { AiClient, AiProvider } from '../../../shared/helpers/ai/ai_client'

function resolveFrontProvider(): AiProvider {
  const raw = String(import.meta.env.VITE_AI_PROVIDER ?? import.meta.env.AI_PROVIDER ?? 'none')
    .trim()
    .toLowerCase()
  if (raw === 'mistral') return 'mistral'
  return 'none'
}

function getMistralApiKey(): string | null {
  const apiKey = String(
    import.meta.env.VITE_MISTRAL_API_KEY ?? import.meta.env.AI_API_KEY ?? ''
  ).trim()
  if (resolveFrontProvider() !== 'mistral' || !apiKey) return null
  return apiKey
}

function parseJsonOrNull(text: unknown): any | null {
  if (typeof text !== 'string') return null
  const trimmed = text.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

export function createFrontAiClient(): AiClient {
  const provider = resolveFrontProvider()

  if (provider === 'mistral') {
    const apiKey = getMistralApiKey()
    if (!apiKey) {
      return {
        provider: 'none',
        completeText: async () => null,
        completeJson: async () => null,
      }
    }

    const client = new Mistral({ apiKey })

    return {
      provider: 'mistral',
      completeText: async (prompt, options) => {
        const response = await client.chat.complete({
          model: 'mistral-small-latest',
          temperature: options?.temperature ?? 0.7,
          messages: [{ role: 'user', content: prompt }],
        })
        const content = response.choices?.[0]?.message?.content
        return typeof content === 'string' ? content : null
      },
      completeJson: async (prompt, options) => {
        const response = await client.chat.complete({
          model: 'mistral-small-latest',
          temperature: options?.temperature ?? 0.4,
          messages: [{ role: 'user', content: prompt }],
        })
        const content = response.choices?.[0]?.message?.content
        return parseJsonOrNull(content)
      },
      ocrToMarkdown: async ({ base64, mimeType }) => {
        const documentUrl = `data:${mimeType};base64,${base64}`
        const response = await client.ocr.process({
          model: 'mistral-ocr-latest',
          document: { type: 'document_url', documentUrl },
        } as any)

        const pages = Array.isArray((response as any)?.pages) ? (response as any).pages : []
        const markdown = pages
          .map((p: any) => (typeof p?.markdown === 'string' ? p.markdown : ''))
          .filter(Boolean)
          .join('\n\n')
          .trim()

        return markdown || null
      },
    }
  }

  return {
    provider: 'none',
    completeText: async () => null,
    completeJson: async () => null,
  }
}
