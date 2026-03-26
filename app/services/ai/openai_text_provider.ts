import type { AiTextCompletionProvider } from '#services/ai/ai_text_completion_provider'
import env from '#start/env'

/**
 * Appels directs à l’API Chat Completions (pas de SDK obligatoire).
 */
export class OpenAiTextProvider implements AiTextCompletionProvider {
  async completeText(prompt: string): Promise<string> {
    const apiKey = env.get('OPENAI_API_KEY')
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY manquante')
    }
    const model = env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      }),
    })

    const json = (await res.json()) as {
      error?: { message?: string }
      choices?: Array<{ message?: { content?: string } }>
    }

    if (!res.ok) {
      throw new Error(json.error?.message || `OpenAI HTTP ${res.status}`)
    }

    const text = json.choices?.[0]?.message?.content?.trim()
    if (!text) {
      throw new Error('Réponse OpenAI vide')
    }
    return text
  }
}
