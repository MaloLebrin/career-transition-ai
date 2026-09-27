import type { AiClient, AiJson } from '#shared/helpers/ai/ai_client'

export interface FakeAiCall {
  kind: 'text' | 'json'
  prompt: string
  options?: { temperature?: number }
}

/**
 * Faux `AiClient` pour les use cases IA : aucune requête réseau. La réponse
 * est soit une valeur, soit une erreur à lever ; chaque appel est journalisé
 * pour vérifier le prompt et la température transmis.
 */
export function makeFakeAiClient(response: {
  text?: string | null
  json?: unknown
  error?: Error
}) {
  const calls: FakeAiCall[] = []
  const client: AiClient = {
    provider: 'none',
    async completeText(prompt, options) {
      calls.push({ kind: 'text', prompt, options })
      if (response.error) throw response.error
      return response.text ?? null
    },
    async completeJson<T extends AiJson>(prompt: string, options?: { temperature?: number }) {
      calls.push({ kind: 'json', prompt, options })
      if (response.error) throw response.error
      return (response.json ?? null) as T | null
    },
  }
  return { client, calls }
}
