import type { EmployeeAiProfile } from '#shared/helpers/ai/exercise_profile'

export function buildValuesQualitativePrompt(input: {
  profile: EmployeeAiProfile
  exerciseData: unknown
}): string {
  return `Tu es un coach carrière expert (bilan de compétences).

## Contexte candidat (profil)
${JSON.stringify(input.profile)}

## Exercice: valeurs (données)
${JSON.stringify(input.exerciseData)}

## Tâche
Analyse les valeurs identifiées et traduis-les en recommandations concrètes.

Contraintes de format:
- 3 sections obligatoires avec ces titres exacts:
  1) Valeurs clés (3 bullets max)
  2) Points de tension potentiels (2 bullets max)
  3) Recommandations de ciblage (3 bullets max, orientées job/secteur/organisation)
- Longueur max: 900 caractères.`
}
