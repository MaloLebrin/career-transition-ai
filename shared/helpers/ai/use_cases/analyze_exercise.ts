import type { AiClient } from '#shared/helpers/ai/ai_client'
import { buildAnalyzeExercisePrompt } from '#shared/helpers/ai/prompts/analyze_exercise'

export async function analyzeExerciseResult(
  client: AiClient,
  type: string,
  data: unknown
): Promise<string> {
  const prompt = buildAnalyzeExercisePrompt(type, data)
  try {
    return (await client.completeText(prompt, { temperature: 0.8 })) || 'Analyse indisponible.'
  } catch {
    return "Erreur lors de la génération de l'analyse."
  }
}

