export function buildAnalyzeExercisePrompt(type: string, data: unknown): string {
  return `Analyse professionnelle pour un accompagnement carrière : ${type}. Données : ${JSON.stringify(data)}.
Produis une analyse courte (max 4 phrases), encourageante, vitaminée, avec un conseil concret basé sur les données reçues.
Sois expert et bienveillant.`
}

