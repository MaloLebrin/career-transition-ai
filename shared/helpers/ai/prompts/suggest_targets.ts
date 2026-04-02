export function buildSuggestTargetsPrompt(profile: { skills: string[]; targetRole: string }): string {
  return `Basé sur ces compétences: ${profile.skills.join(', ')} et ce poste cible: ${profile.targetRole},
suggère 5 entreprises françaises (réelles) et 3 types de secteurs porteurs pour ce profil.
Réponds exclusivement en JSON avec les clés 'companies' (array de strings) et 'sectors' (array de strings).`
}

