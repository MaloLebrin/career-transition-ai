import { createServerAiClient } from '#services/ai/server_ai_client'
import type { AiClient } from '#shared/helpers/ai/ai_client'
import { pseudonymizeForAi } from '#shared/helpers/ai/exercise_profile'
import {
  extractCvDataFromMarkdown,
  type ExtractedCvData,
} from '#shared/helpers/ai/use_cases/extract_cv_from_markdown'
import { extractSkillMappingFromText } from '#shared/helpers/ai/use_cases/extract_skill_mapping'
import { suggestTargets } from '#shared/helpers/ai/use_cases/suggest_targets'
import { readFile } from 'node:fs/promises'

/**
 * Assistance IA à la saisie (import de CV, cartographie des compétences,
 * ciblage), exposée par `AiAssistController`. Tous les appels au fournisseur
 * partent du serveur.
 */
export class AiAssistService {
  constructor(private clientFactory: () => AiClient = createServerAiClient) {}

  /**
   * OCR du CV puis extraction structurée. Le CV est transmis tel quel (nom,
   * e-mail… sont précisément ce qu'on veut en extraire) — cf. docs/RGPD.md.
   */
  async extractCv(file: { path: string; mimeType: string }): Promise<ExtractedCvData | null> {
    const client = this.clientFactory()
    if (!client.ocrToMarkdown) return null

    const content = await readFile(file.path)
    const base64 = content.toString('base64')
    const markdown = await client.ocrToMarkdown({ base64, mimeType: file.mimeType })
    if (!markdown) return null
    return extractCvDataFromMarkdown(client, markdown)
  }

  /** Texte libre de l'utilisateur, pseudonymisé avant envoi. */
  async extractSkillMapping(
    text: string,
    identity: { name?: string | null; email?: string | null }
  ) {
    return extractSkillMappingFromText(this.clientFactory(), pseudonymizeForAi(text, identity))
  }

  async suggestTargets(profile: { skills: string[]; targetRole: string }) {
    return suggestTargets(this.clientFactory(), profile)
  }
}
