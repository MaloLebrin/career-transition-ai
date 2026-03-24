/**
 * Contrat minimal pour brancher n’importe quel modèle (Gemini, OpenAI, etc.)
 * dans les jobs serveur.
 */
export interface AiTextCompletionProvider {
  completeText(prompt: string): Promise<string>
}
