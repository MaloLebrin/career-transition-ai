import type { AiClient } from '../../../shared/helpers/ai/ai_client'
import { extractCvDataFromMarkdown } from '../../../shared/helpers/ai/use_cases/extract_cv_from_markdown'
import { extractSkillMappingFromText as extractSkillMappingFromTextUseCase } from '../../../shared/helpers/ai/use_cases/extract_skill_mapping'
import { suggestTargets as suggestTargetsUseCase } from '../../../shared/helpers/ai/use_cases/suggest_targets'
import { createFrontAiClient } from './front_ai_client'

function getFrontClient(): AiClient {
  return createFrontAiClient()
}

export async function extractSkillMappingFromText(text: string) {
  return extractSkillMappingFromTextUseCase(getFrontClient(), text)
}

export async function suggestTargets(profile: { skills: string[]; targetRole: string }) {
  return suggestTargetsUseCase(getFrontClient(), profile)
}

export async function extractCVData(base64File: string, mimeType: string) {
  const client = getFrontClient()

  if (client.provider === 'mistral' && client.ocrToMarkdown) {
    const normalizedBase64 = base64File.includes(',') ? base64File.split(',')[1] : base64File
    const markdown = await client.ocrToMarkdown({ base64: normalizedBase64, mimeType })
    if (!markdown) return null
    return extractCvDataFromMarkdown(client, markdown)
  }

  return null
}

