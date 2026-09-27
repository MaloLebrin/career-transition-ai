import { test } from '@japa/runner'
import { EXERCICE_RESULTS_TYPES, type ExerciceResultType } from '#shared/constants/exercises'
import type { EmployeeAiProfile } from '#shared/helpers/ai/exercise_profile'
import { buildQualitativePromptForExerciseType } from '#shared/helpers/ai/prompts/exercises/index'

const profile: EmployeeAiProfile = {
  name: 'Marie Martin',
  currentRole: 'Développeuse',
  targetRole: 'Lead Tech',
  summary: 'Profil produit.',
  skills: [{ name: 'TypeScript', level: 4 }],
  experiences: [],
  educations: [],
}

const exerciseData = { marker: 'donnees-exercice-42' }

/**
 * Chaque exercice a son prompt dédié : en-tête « Exercice: … » et sections
 * obligatoires. Les prompts motivation et DISC sont couverts par
 * `tests/unit/shared/ai_exercise_prompts.spec.ts`.
 */
const CASES: Array<{ type: ExerciceResultType; heading: string; sections: string[] }> = [
  {
    type: EXERCICE_RESULTS_TYPES.VALUES,
    heading: '## Exercice: valeurs (données)',
    sections: ['Valeurs clés', 'Points de tension potentiels', 'Recommandations de ciblage'],
  },
  {
    type: EXERCICE_RESULTS_TYPES.TARGETING,
    heading: '## Exercice: ciblage (données)',
    sections: ['Cohérence globale', 'Opportunités', 'Prochaines actions'],
  },
  {
    type: EXERCICE_RESULTS_TYPES.SKILL_MAPPING,
    heading: '## Exercice: cartographie des compétences (données)',
    sections: ['Synthèse', 'Points forts', 'À renforcer'],
  },
  {
    type: EXERCICE_RESULTS_TYPES.CIRCLE_OF_CONTROL,
    heading: '## Exercice: cercle de contrôle (données)',
    sections: ['Lecture', 'Levier principal', 'Plan 7 jours'],
  },
  {
    type: EXERCICE_RESULTS_TYPES.LIFE_CURVE,
    heading: '## Exercice: courbe de vie (données)',
    sections: ['Périodes clés', 'Hypothèses', 'Décision à tester'],
  },
  {
    type: EXERCICE_RESULTS_TYPES.PERSONALITY,
    heading: '## Exercice: personnalité (données)',
    sections: ['Synthèse', 'Ce qui te réussit', 'Ce qui te coûte', 'Ajustement concret'],
  },
  {
    type: EXERCICE_RESULTS_TYPES.COMPETENCIES,
    heading: '## Exercice: compétences (données)',
    sections: ['Compétences fortes', 'Compétences à développer', 'Transfert vers la cible'],
  },
  {
    type: EXERCICE_RESULTS_TYPES.CV_ANALYSIS,
    heading: '## Exercice: analyse CV (données)',
    sections: ['Points forts', 'Manques / flous', 'Top 3 améliorations'],
  },
]

test.group('buildQualitativePromptForExerciseType — prompts par exercice', () => {
  for (const { type, heading, sections } of CASES) {
    test(`${type} : en-tête, profil, données et sections obligatoires`, ({ assert }) => {
      const prompt = buildQualitativePromptForExerciseType(type, { profile, exerciseData })

      assert.include(prompt, 'Tu es un coach carrière expert')
      assert.include(prompt, heading)
      assert.include(prompt, JSON.stringify(profile))
      assert.include(prompt, JSON.stringify(exerciseData))
      for (const section of sections) {
        assert.include(prompt, section)
      }
      assert.include(prompt, 'Longueur max: 900 caractères.')
    })
  }

  test('chaque type produit un prompt distinct', ({ assert }) => {
    const prompts = CASES.map(({ type }) =>
      buildQualitativePromptForExerciseType(type, { profile, exerciseData })
    )
    assert.lengthOf(new Set(prompts), CASES.length)
  })
})
