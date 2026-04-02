import { EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'
import type { EmployeeAiProfile } from '#shared/helpers/ai/exercise_profile'
import { buildQualitativePromptForExerciseType } from '#shared/helpers/ai/prompts/exercises/index'
import { test } from '@japa/runner'

const baseProfile: EmployeeAiProfile = {
  name: 'Marie Martin',
  currentRole: 'Développeuse',
  targetRole: 'Lead Tech',
  summary: 'Profil orienté produit et collaboration.',
  skills: [{ name: 'TypeScript', level: 4 }],
  experiences: [
    {
      title: 'Développeuse',
      company: 'ACME',
      type: 'CDI',
      startDate: '2024-01-01',
      endDate: '',
      isCurrent: true,
      description: 'Dev front et coordination.',
    },
  ],
  educations: [
    {
      degree: 'Master',
      school: 'Université',
      startDate: '2018-09-01',
      endDate: '2020-06-30',
      isCurrent: false,
      description: 'Informatique.',
    },
  ],
}

test.group('shared/helpers/ai prompts per exercise', () => {
  test('motivation prompt includes required section titles', ({ assert }) => {
    const prompt = buildQualitativePromptForExerciseType(EXERCICE_RESULTS_TYPES.MOTIVATION as any, {
      profile: baseProfile,
      exerciseData: { ranked: [], matrix: [] },
    })
    assert.include(prompt, 'Synthèse')
    assert.include(prompt, 'Lecture du profil')
    assert.include(prompt, 'Conseil actionnable 7 jours')
  })

  test('disc prompt includes required section titles', ({ assert }) => {
    const prompt = buildQualitativePromptForExerciseType(EXERCICE_RESULTS_TYPES.DISC as any, {
      profile: baseProfile,
      exerciseData: { scores: { D: 3, I: 2, S: 1, C: 4 } },
    })
    assert.include(prompt, 'Forces')
    assert.include(prompt, 'Risques/angles morts')
    assert.include(prompt, 'Environnement idéal')
  })

  test('fallback uses generic analyze_exercise prompt', ({ assert }) => {
    const prompt = buildQualitativePromptForExerciseType('unknown_type' as any, {
      profile: baseProfile,
      exerciseData: { hello: 'world' },
    })
    assert.include(prompt, 'Analyse professionnelle')
    assert.include(prompt, '"hello":"world"')
  })
})

