import type { EmployeeAiProfile } from '#shared/helpers/ai/exercise_profile'

export function buildCompetenciesQualitativePrompt(input: {
  profile: EmployeeAiProfile
  exerciseData: unknown
}): string {
  return `Tu es un coach carrière expert (bilan de compétences).

## Contexte candidat (profil)
${JSON.stringify(input.profile)}

## Exercice: compétences (données)
${JSON.stringify(input.exerciseData)}

## Tâche
Fais un résumé des compétences saillantes et de leur transférabilité vers la cible.

Contraintes de format:
- 3 sections obligatoires avec ces titres exacts:
  1) Compétences fortes (3 bullets max)
  2) Compétences à développer (3 bullets max)
  3) Transfert vers la cible (2 bullets max, liés à targetRole)
- Longueur max: 900 caractères.`
}
