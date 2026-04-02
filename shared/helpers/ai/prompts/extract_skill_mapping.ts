export function buildExtractSkillMappingPrompt(text: string): string {
  return `Analyse le récit d'expérience suivant : "${text}".
Extrais les missions principales et les activités liées mentionnées.
Si tu identifies des résultats chiffrés ou des outils spécifiques, place-les dans la colonne 'proof'.
Réponds exclusivement en JSON avec cette structure:
{ "mapping": [ { "mission": "string", "activity": "string", "proof": "string" } ] }`
}

