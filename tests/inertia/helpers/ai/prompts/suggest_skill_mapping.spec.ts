import { describe, expect, test } from 'vitest'
import type { AiClient } from '#shared/helpers/ai/ai_client'
import { buildSuggestSkillMappingPrompt } from '#shared/helpers/ai/prompts/suggest_skill_mapping'
import { suggestSkillMapping } from '#shared/helpers/ai/use_cases/suggest_skill_mapping'

function schemaFromPrompt(prompt: string): unknown {
  return JSON.parse(prompt.slice(prompt.indexOf('[')))
}

describe('buildSuggestSkillMappingPrompt', () => {
  test('cite l’intitulé du poste entre guillemets', () => {
    expect(buildSuggestSkillMappingPrompt('Chargé·e de recrutement')).toContain(
      'pour le poste de "Chargé·e de recrutement".'
    )
  })

  test('fixe le volume attendu : 3 missions, 2 activités chacune', () => {
    const prompt = buildSuggestSkillMappingPrompt('Data analyst')
    expect(prompt).toContain('3 missions principales')
    expect(prompt).toContain('liste 2 activités concrètes')
    expect(prompt).toContain('bilan de compétences et VAE')
  })

  test('l’exemple de structure est un tableau JSON valide, compris par le use case', async () => {
    const schema = schemaFromPrompt(buildSuggestSkillMappingPrompt('x'))
    expect(schema).toEqual([
      { mission: 'Titre de la mission 1', activities: ['Activité 1.1', 'Activité 1.2'] },
    ])

    const client: AiClient = {
      provider: 'none',
      completeText: async () => null,
      completeJson: async <T>() => schema as T,
    }
    await expect(suggestSkillMapping(client, 'x')).resolves.toEqual(schema)
  })

  test('change avec le poste demandé', () => {
    expect(buildSuggestSkillMappingPrompt('A')).not.toBe(buildSuggestSkillMappingPrompt('B'))
  })
})
