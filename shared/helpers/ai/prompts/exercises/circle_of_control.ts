import type { EmployeeAiProfile } from '#shared/helpers/ai/exercise_profile'

export function buildCircleOfControlQualitativePrompt(input: {
  profile: EmployeeAiProfile
  exerciseData: unknown
}): string {
  return `Tu es un coach carrière expert (bilan de compétences).

## Contexte candidat (profil)
${JSON.stringify(input.profile)}

## Exercice: cercle de contrôle (données)
${JSON.stringify(input.exerciseData)}

## Tâche
Fais un résumé utile: ce que la personne contrôle vs influence vs subit, puis un plan simple.

Contraintes de format:
- 3 sections obligatoires avec ces titres exacts:
  1) Lecture (2-3 phrases)
  2) Levier principal (1 bullet)
  3) Plan 7 jours (3 actions, numérotées)
- Longueur max: 900 caractères.`
}
