export function buildExtractCvFromMarkdownPrompt(markdown: string): string {
  return `Tu analyses un CV déjà OCRisé en markdown.
Extrais les informations suivantes de manière fidèle (pas d'invention).
Si une information est absente, renvoie une chaîne vide ou un tableau vide.
Réponds exclusivement en JSON avec ce schéma:
{
  "name":"string",
  "email":"string",
  "currentRole":"string",
  "suggestedTargetRole":"string",
  "summary":"string",
  "skills":[{"name":"string","level":3}],
  "experiences":[{"id":"string","title":"string","company":"string","type":"CDI","startDate":"","endDate":"","isCurrent":false,"description":""}],
  "educations":[{"id":"string","degree":"string","school":"string","startDate":"","endDate":"","isCurrent":false,"description":""}]
}
CV markdown OCR:
${markdown.slice(0, 120000)}`
}

