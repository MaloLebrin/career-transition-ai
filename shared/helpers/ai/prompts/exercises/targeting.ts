import type { EmployeeAiProfile } from '#shared/helpers/ai/exercise_profile'

export function buildTargetingQualitativePrompt(input: {
  profile: EmployeeAiProfile
  exerciseData: unknown
}): string {
  return `Tu es un coach carrière expert (bilan de compétences).

## Contexte candidat (profil)
${JSON.stringify(input.profile)}

## Exercice: ciblage (données)
${JSON.stringify(input.exerciseData)}

## Tâche
Évalue la cohérence du ciblage avec le profil et propose des ajustements.

Contraintes de format:
- 3 sections obligatoires avec ces titres exacts:
  1) Cohérence globale (2 phrases)
  2) Opportunités (3 bullets max)
  3) Prochaines actions (3 actions, numérotées)
- Longueur max: 900 caractères.`
}
