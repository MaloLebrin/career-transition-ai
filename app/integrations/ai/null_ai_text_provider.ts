import type { AiTextCompletionProvider } from '#integrations/ai/ai_text_completion_provider'

/** Aucune clé / mode `none` : message stable sans appel réseau. */
export class NullAiTextProvider implements AiTextCompletionProvider {
  async completeText(_prompt: string): Promise<string> {
    return "Analyse indisponible : aucun fournisseur IA configuré (voir AI_PROVIDER et les clés API)."
  }
}

