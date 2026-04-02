import type { EmployeeAiProfile } from '#shared/helpers/ai/exercise_profile'

export function buildCvAnalysisQualitativePrompt(input: {
  profile: EmployeeAiProfile
  exerciseData: unknown
}): string {
  return `Tu es un coach carrière expert (bilan de compétences) avec expertise CV.

## Contexte candidat (profil)
${JSON.stringify(input.profile)}

## Exercice: analyse CV (données)
${JSON.stringify(input.exerciseData)}

## Tâche
Rédige un retour court sur la cohérence du CV avec la cible et les améliorations prioritaires.

Contraintes de format:
- 3 sections obligatoires avec ces titres exacts:
  1) Points forts (3 bullets max)
  2) Manques / flous (3 bullets max)
  3) Top 3 améliorations (3 items numérotés, actionnables)
- Longueur max: 900 caractères.`
}
