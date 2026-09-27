import { describe, expect, test } from 'vitest'
import { EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'
import type { EmployeeAiProfile } from '#shared/helpers/ai/exercise_profile'
import { buildAnalyzeExercisePrompt } from '#shared/helpers/ai/prompts/analyze_exercise'
import { buildQualitativePromptForExerciseType } from '#shared/helpers/ai/prompts/exercises/index'

const profile: EmployeeAiProfile = {
  name: 'Camille',
  currentRole: 'Comptable',
  targetRole: 'Data analyst',
  summary: '',
  skills: [{ name: 'Excel', level: 4 }],
  experiences: [],
  educations: [],
}

const expectedSection: Record<string, string> = {
  [EXERCICE_RESULTS_TYPES.MOTIVATION]: '## Exercice: motivations (données)',
  [EXERCICE_RESULTS_TYPES.VALUES]: '## Exercice: valeurs (données)',
  [EXERCICE_RESULTS_TYPES.DISC]: '## Exercice: DISC (données)',
  [EXERCICE_RESULTS_TYPES.TARGETING]: '## Exercice: ciblage (données)',
  [EXERCICE_RESULTS_TYPES.SKILL_MAPPING]: '## Exercice: cartographie des compétences (données)',
  [EXERCICE_RESULTS_TYPES.CIRCLE_OF_CONTROL]: '## Exercice: cercle de contrôle (données)',
  [EXERCICE_RESULTS_TYPES.LIFE_CURVE]: '## Exercice: courbe de vie (données)',
  [EXERCICE_RESULTS_TYPES.PERSONALITY]: '## Exercice: personnalité (données)',
  [EXERCICE_RESULTS_TYPES.COMPETENCIES]: '## Exercice: compétences (données)',
  [EXERCICE_RESULTS_TYPES.CV_ANALYSIS]: '## Exercice: analyse CV (données)',
}

describe('buildQualitativePromptForExerciseType', () => {
  test.each(Object.entries(expectedSection))(
    '%s : prompt dédié avec le profil et les données de l’exercice',
    (type, section) => {
      const exerciseData = { marker: `data-${type}` }
      const prompt = buildQualitativePromptForExerciseType(type as never, { profile, exerciseData })
      expect(prompt).toContain(section)
      expect(prompt).toContain(JSON.stringify(profile))
      expect(prompt).toContain(JSON.stringify(exerciseData))
      expect(prompt).toContain('Tu es un coach carrière expert')
    }
  )

  test('type non géré : repli sur le prompt générique', () => {
    const exerciseData = { a: 1 }
    expect(buildQualitativePromptForExerciseType('autre' as never, { profile, exerciseData })).toBe(
      buildAnalyzeExercisePrompt('autre', exerciseData)
    )
  })
})
