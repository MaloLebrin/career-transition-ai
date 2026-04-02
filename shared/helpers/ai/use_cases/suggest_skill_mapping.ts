import type { AiClient } from '#shared/helpers/ai/ai_client'
import { buildSuggestSkillMappingPrompt } from '#shared/helpers/ai/prompts/suggest_skill_mapping'

export interface SkillMappingSuggestionItem {
  mission: string
  activities: string[]
}

export async function suggestSkillMapping(
  client: AiClient,
  jobTitle: string
): Promise<SkillMappingSuggestionItem[]> {
  const prompt = buildSuggestSkillMappingPrompt(jobTitle)
  try {
    const data = await client.completeJson<any>(prompt, { temperature: 0.4 })
    if (!Array.isArray(data)) return []
    return data
      .map((row) => {
        const mission = typeof (row as any)?.mission === 'string' ? (row as any).mission : ''
        const activitiesRaw = (row as any)?.activities
        const activities = Array.isArray(activitiesRaw)
          ? activitiesRaw.filter((a) => typeof a === 'string')
          : []
        return { mission, activities }
      })
      .filter((x) => x.mission && x.activities.length > 0)
  } catch {
    return []
  }
}

