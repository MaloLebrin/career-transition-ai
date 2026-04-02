import type { AiTextCompletionProvider } from '#services/ai/ai_text_completion_provider'
import env from '#start/env'
import { Mistral } from '@mistralai/mistralai'

export class MistralTextProvider implements AiTextCompletionProvider {
  async completeText(prompt: string): Promise<string> {
    const apiKey = env.get('MISTRAL_API_KEY')
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY manquante')
    }
    const model = env.get('MISTRAL_MODEL') ?? 'mistral-small-latest'

    const client = new Mistral({ apiKey })
    const response = await client.chat.complete({
      model,
      temperature: 0.8,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.choices?.[0]?.message?.content
    const text = typeof content === 'string' ? content.trim() : ''
    if (!text) {
      throw new Error('Réponse Mistral vide')
    }
    return text
  }
}
