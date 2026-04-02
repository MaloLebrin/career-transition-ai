import type { EmployeeAiProfile } from '#shared/helpers/ai/exercise_profile'

export function buildMotivationQualitativePrompt(input: {
  profile: EmployeeAiProfile
  exerciseData: unknown
}): string {
  return `Tu es un coach carrière expert (bilan de compétences).

## Contexte candidat (profil)
${JSON.stringify(input.profile)}

## Exercice: motivations (données)
${JSON.stringify(input.exerciseData)}

## Tâche
Rédige une analyse courte et très actionnable, en FRANÇAIS, adaptée au profil.

Contraintes de format:
- 3 sections obligatoires avec ces titres exacts:
  1) Synthèse (2-3 phrases)
  2) Lecture du profil (3 bullets max)
  3) Conseil actionnable 7 jours (3 actions concrètes, numérotées)
- Pas de jargon, pas d'invention: si une info manque, rester général.
- Longueur max: 900 caractères.`
}
