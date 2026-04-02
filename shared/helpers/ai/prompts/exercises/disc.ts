import type { EmployeeAiProfile } from '#shared/helpers/ai/exercise_profile'

export function buildDiscQualitativePrompt(input: {
  profile: EmployeeAiProfile
  exerciseData: unknown
}): string {
  return `Tu es un coach carrière expert (bilan de compétences).

## Contexte candidat (profil)
${JSON.stringify(input.profile)}

## Exercice: DISC (données)
${JSON.stringify(input.exerciseData)}

## Tâche
Interprète le profil DISC et relie-le au contexte professionnel du candidat.

Contraintes de format:
- 4 sections obligatoires avec ces titres exacts:
  1) Synthèse (1-2 phrases)
  2) Forces (3 bullets)
  3) Risques/angles morts (2 bullets)
  4) Environnement idéal (1 phrase)
- Longueur max: 900 caractères.`
}
