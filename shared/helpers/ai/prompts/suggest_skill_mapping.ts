export function buildSuggestSkillMappingPrompt(jobTitle: string): string {
  return `En tant qu'expert en bilan de compétences et VAE, suggère une structure de compétences pour le poste de "${jobTitle}".
Propose 3 missions principales. Pour chaque mission, liste 2 activités concrètes typiques de ce métier.
Réponds exclusivement en JSON avec cette structure précise:
[
  { "mission": "Titre de la mission 1", "activities": ["Activité 1.1", "Activité 1.2"] }
]`
}
