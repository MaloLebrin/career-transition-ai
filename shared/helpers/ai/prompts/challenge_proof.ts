export function buildChallengeProofPrompt(activity: string, proof: string): string {
  return `Un candidat décrit son activité : "${activity}". Sa preuve actuelle est : "${proof}".
Pose une SEULE question très courte (max 15 mots) et stimulante pour l'aider à quantifier ou illustrer son succès (ex: volume, budget, impact, outil).
La question doit être directe et inciter à donner un chiffre ou un fait précis.`
}
