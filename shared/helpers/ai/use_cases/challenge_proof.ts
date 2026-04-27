import type { AiClient } from '#shared/helpers/ai/ai_client'
import { buildChallengeProofPrompt } from '#shared/helpers/ai/prompts/challenge_proof'

const DEFAULT_QUESTION = "Pouvez-vous préciser l'impact ou l'outil utilisé ?"

export async function challengeProof(
  client: AiClient,
  activity: string,
  proof: string
): Promise<string> {
  const prompt = buildChallengeProofPrompt(activity, proof)
  try {
    return (await client.completeText(prompt, { temperature: 0.7 })) || DEFAULT_QUESTION
  } catch {
    return DEFAULT_QUESTION
  }
}
