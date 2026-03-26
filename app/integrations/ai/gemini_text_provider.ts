import type { AiTextCompletionProvider } from '#integrations/ai/ai_text_completion_provider'
import env from '#start/env'
import { GoogleGenAI } from '@google/genai'

const MODEL = 'gemini-2.0-flash'

export class GeminiTextProvider implements AiTextCompletionProvider {
  async completeText(prompt: string): Promise<string> {
    const apiKey = env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY manquante')
    }
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: { parts: [{ text: prompt }] },
      config: { temperature: 0.8 },
    })
    return response.text?.trim() || 'Analyse indisponible.'
  }
}

