import { describe, expect, test } from 'vitest'
import type { AiClient } from '../../../shared/helpers/ai/ai_client'
import { buildAnalyzeExercisePrompt } from '../../../shared/helpers/ai/prompts/analyze_exercise'
import { buildChallengeProofPrompt } from '../../../shared/helpers/ai/prompts/challenge_proof'
import { buildExtractSkillMappingPrompt } from '../../../shared/helpers/ai/prompts/extract_skill_mapping'
import { buildSuggestSkillMappingPrompt } from '../../../shared/helpers/ai/prompts/suggest_skill_mapping'
import { buildSuggestTargetsPrompt } from '../../../shared/helpers/ai/prompts/suggest_targets'
import { analyzeExerciseResult } from '../../../shared/helpers/ai/use_cases/analyze_exercise'
import { challengeProof } from '../../../shared/helpers/ai/use_cases/challenge_proof'
import { extractSkillMappingFromText } from '../../../shared/helpers/ai/use_cases/extract_skill_mapping'
import { suggestSkillMapping } from '../../../shared/helpers/ai/use_cases/suggest_skill_mapping'
import { suggestTargets } from '../../../shared/helpers/ai/use_cases/suggest_targets'

function makeFakeClient(handlers: Partial<AiClient>): AiClient {
  return {
    provider: 'none',
    completeText: async () => null,
    completeJson: async () => null,
    ...handlers,
  }
}

describe('shared/helpers/ai (prompts)', () => {
  test('buildSuggestSkillMappingPrompt includes job title', () => {
    expect(buildSuggestSkillMappingPrompt('Product Manager')).toContain('Product Manager')
  })

  test('buildExtractSkillMappingPrompt includes input text', () => {
    expect(buildExtractSkillMappingPrompt('Mon récit')).toContain('Mon récit')
  })

  test('buildChallengeProofPrompt includes activity + proof', () => {
    const prompt = buildChallengeProofPrompt('activité', 'preuve')
    expect(prompt).toContain('activité')
    expect(prompt).toContain('preuve')
  })

  test('buildAnalyzeExercisePrompt includes type and data json', () => {
    expect(buildAnalyzeExercisePrompt('values', { a: 1 })).toContain('"a":1')
  })

  test('buildSuggestTargetsPrompt includes targetRole', () => {
    expect(buildSuggestTargetsPrompt({ skills: ['A'], targetRole: 'Dev' })).toContain('Dev')
  })
})

describe('shared/helpers/ai (use cases)', () => {
  test('suggestTargets returns empty lists on invalid json', async () => {
    const client = makeFakeClient({
      provider: 'gemini',
      completeJson: async () => 'not-json' as any,
    })
    expect(await suggestTargets(client, { skills: ['x'], targetRole: 'y' })).toEqual({
      companies: [],
      sectors: [],
    })
  })

  test('suggestTargets returns parsed arrays', async () => {
    const client = makeFakeClient({
      provider: 'gemini',
      completeJson: async () => ({ companies: ['A', 2], sectors: ['S'] }) as any,
    })
    expect(await suggestTargets(client, { skills: ['x'], targetRole: 'y' })).toEqual({
      companies: ['A'],
      sectors: ['S'],
    })
  })

  test('suggestSkillMapping parses array output', async () => {
    const client = makeFakeClient({
      provider: 'gemini',
      completeJson: async () => [{ mission: 'M1', activities: ['A1', 2] }] as any,
    })
    expect(await suggestSkillMapping(client, 'Dev')).toEqual([
      { mission: 'M1', activities: ['A1'] },
    ])
  })

  test('extractSkillMappingFromText always returns mapping array', async () => {
    const client = makeFakeClient({
      provider: 'gemini',
      completeJson: async () => ({ mapping: [{ mission: 'm', activity: 'a', proof: 'p' }] }) as any,
    })
    expect(await extractSkillMappingFromText(client, 'x')).toEqual({
      mapping: [{ mission: 'm', activity: 'a', proof: 'p' }],
    })
  })

  test('challengeProof uses default question when provider returns null', async () => {
    const client = makeFakeClient({
      provider: 'gemini',
      completeText: async () => null,
    })
    expect(await challengeProof(client, 'a', 'p')).toContain('impact')
  })

  test('analyzeExerciseResult uses fallback when provider throws', async () => {
    const client = makeFakeClient({
      provider: 'gemini',
      completeText: async () => {
        throw new Error('boom')
      },
    })
    expect(await analyzeExerciseResult(client, 'x', {})).toContain('Erreur lors de la génération')
  })
})
