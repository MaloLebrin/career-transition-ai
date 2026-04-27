export type AiProvider = 'mistral' | 'none'

export type AiJson = Record<string, unknown> | unknown[] | null

export interface AiClient {
  provider: AiProvider
  completeText(prompt: string, options?: { temperature?: number }): Promise<string | null>
  completeJson<T extends AiJson>(
    prompt: string,
    options?: { temperature?: number }
  ): Promise<T | null>
  ocrToMarkdown?: (input: { base64: string; mimeType: string }) => Promise<string | null>
}
