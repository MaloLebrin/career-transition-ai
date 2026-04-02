import type { AiClient } from '#shared/helpers/ai/ai_client'
import { buildExtractSkillMappingPrompt } from '#shared/helpers/ai/prompts/extract_skill_mapping'

export interface ExtractedSkillMappingRow {
  mission: string
  activity: string
  proof: string
}

export async function extractSkillMappingFromText(
  client: AiClient,
  text: string
): Promise<{ mapping: ExtractedSkillMappingRow[] }> {
  const prompt = buildExtractSkillMappingPrompt(text)
  try {
    const data = await client.completeJson<{ mapping?: unknown }>(prompt, { temperature: 0.4 })
    const mappingRaw = (data as any)?.mapping
    const mapping = Array.isArray(mappingRaw)
      ? mappingRaw
          .map((row: any) => ({
            mission: typeof row?.mission === 'string' ? row.mission : '',
            activity: typeof row?.activity === 'string' ? row.activity : '',
            proof: typeof row?.proof === 'string' ? row.proof : '',
          }))
          .filter((r) => r.mission || r.activity || r.proof)
      : []
    return { mapping }
  } catch {
    return { mapping: [] }
  }
}

