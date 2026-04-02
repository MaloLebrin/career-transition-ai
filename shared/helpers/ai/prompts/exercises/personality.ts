import type { EmployeeAiProfile } from '#shared/helpers/ai/exercise_profile'

export function buildPersonalityQualitativePrompt(input: {
  profile: EmployeeAiProfile
  exerciseData: unknown
}): string {
  return `Tu es un coach carrière expert (bilan de compétences).

## Contexte candidat (profil)
${JSON.stringify(input.profile)}

## Exercice: personnalité (données)
${JSON.stringify(input.exerciseData)}

## Tâche
Relie les traits/axes identifiés à des comportements observables au travail.

Contraintes de format:
- 4 sections obligatoires avec ces titres exacts:
  1) Synthèse (2 phrases)
  2) Ce qui te réussit (3 bullets max)
  3) Ce qui te coûte (2 bullets max)
  4) Ajustement concret (2 actions, numérotées)
- Longueur max: 900 caractères.`
}
