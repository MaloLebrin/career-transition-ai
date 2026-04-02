import type { EmployeeAiProfile } from '#shared/helpers/ai/exercise_profile'

export function buildSkillMappingQualitativePrompt(input: {
  profile: EmployeeAiProfile
  exerciseData: unknown
}): string {
  return `Tu es un coach carrière expert (bilan de compétences).

## Contexte candidat (profil)
${JSON.stringify(input.profile)}

## Exercice: cartographie des compétences (données)
${JSON.stringify(input.exerciseData)}

## Tâche
Résume la qualité des preuves/impacts et propose une amélioration immédiate.

Contraintes de format:
- 3 sections obligatoires avec ces titres exacts:
  1) Synthèse (2 phrases)
  2) Points forts (3 bullets max, basés sur les preuves)
  3) À renforcer (3 bullets max, avec exemples de quantification)
- Longueur max: 900 caractères.`
}

