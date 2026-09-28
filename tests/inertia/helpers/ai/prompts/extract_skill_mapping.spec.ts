import { describe, expect, test } from 'vitest'
import type { AiClient } from '#shared/helpers/ai/ai_client'
import { buildExtractSkillMappingPrompt } from '#shared/helpers/ai/prompts/extract_skill_mapping'
import { extractSkillMappingFromText } from '#shared/helpers/ai/use_cases/extract_skill_mapping'

function schemaFromPrompt(prompt: string): unknown {
  const lastLine = prompt.trim().split('\n').at(-1)!
  return JSON.parse(lastLine)
}

describe('buildExtractSkillMappingPrompt', () => {
  test('cite le récit d’expérience entre guillemets', () => {
    const text = 'J’ai piloté la migration comptable vers SAP en 6 mois.'
    expect(buildExtractSkillMappingPrompt(text)).toContain(
      `Analyse le récit d'expérience suivant : "${text}".`
    )
  })

  test('demande missions, activités et preuves chiffrées dans « proof »', () => {
    const prompt = buildExtractSkillMappingPrompt('x')
    expect(prompt).toContain('missions principales')
    expect(prompt).toContain('activités')
    expect(prompt).toContain("colonne 'proof'")
    expect(prompt).toContain('Réponds exclusivement en JSON')
  })

  test('la structure demandée est du JSON valide, comprise par le use case', async () => {
    const schema = schemaFromPrompt(buildExtractSkillMappingPrompt('x'))
    expect(schema).toEqual({
      mapping: [{ mission: 'string', activity: 'string', proof: 'string' }],
    })

    const client: AiClient = {
      provider: 'none',
      completeText: async () => null,
      completeJson: async <T>() => schema as T,
    }
    await expect(extractSkillMappingFromText(client, 'x')).resolves.toEqual(schema)
  })

  test('est déterministe', () => {
    expect(buildExtractSkillMappingPrompt('a')).toBe(buildExtractSkillMappingPrompt('a'))
  })
})
