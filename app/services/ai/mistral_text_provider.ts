import type { AiTextCompletionProvider } from '#services/ai/ai_text_completion_provider'
import env from '#start/env'

export class MistralTextProvider implements AiTextCompletionProvider {
  async completeText(prompt: string): Promise<string> {
    const apiKey = env.get('MISTRAL_API_KEY')
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY manquante')
    }
    const model = env.get('MISTRAL_MODEL') ?? 'mistral-small-latest'

    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.8,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const json = (await res.json()) as {
      message?: string
      choices?: Array<{ message?: { content?: string } }>
    }

    if (!res.ok) {
      throw new Error(json.message || `Mistral HTTP ${res.status}`)
    }

    const text = json.choices?.[0]?.message?.content?.trim()
    if (!text) {
      throw new Error('Réponse Mistral vide')
    }
    return text
  }
}

