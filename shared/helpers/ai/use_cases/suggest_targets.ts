import type { AiClient } from '#shared/helpers/ai/ai_client'
import { buildSuggestTargetsPrompt } from '#shared/helpers/ai/prompts/suggest_targets'

export async function suggestTargets(
  client: AiClient,
  profile: { skills: string[]; targetRole: string }
): Promise<{ companies: string[]; sectors: string[] }> {
  const prompt = buildSuggestTargetsPrompt(profile)
  try {
    const data = await client.completeJson<{ companies?: unknown; sectors?: unknown }>(prompt, {
      temperature: 0.4,
    })
    const companies = Array.isArray((data as any)?.companies)
      ? (data as any).companies.filter((c: any) => typeof c === 'string')
      : []
    const sectors = Array.isArray((data as any)?.sectors)
      ? (data as any).sectors.filter((s: any) => typeof s === 'string')
      : []
    return { companies, sectors }
  } catch {
    return { companies: [], sectors: [] }
  }
}
