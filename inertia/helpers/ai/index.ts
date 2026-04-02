import { Type } from '@google/genai'
import type { AiClient } from '../../../shared/helpers/ai/ai_client'
import { extractCvDataFromMarkdown } from '../../../shared/helpers/ai/use_cases/extract_cv_from_markdown'
import { analyzeExerciseResult as analyzeExerciseResultUseCase } from '../../../shared/helpers/ai/use_cases/analyze_exercise'
import { challengeProof as challengeProofUseCase } from '../../../shared/helpers/ai/use_cases/challenge_proof'
import { extractSkillMappingFromText as extractSkillMappingFromTextUseCase } from '../../../shared/helpers/ai/use_cases/extract_skill_mapping'
import { suggestSkillMapping as suggestSkillMappingUseCase } from '../../../shared/helpers/ai/use_cases/suggest_skill_mapping'
import { suggestTargets as suggestTargetsUseCase } from '../../../shared/helpers/ai/use_cases/suggest_targets'
import { createFrontAiClient } from './front_ai_client'
import { GoogleGenAI } from '@google/genai'

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = String(import.meta.env.VITE_GEMINI_API_KEY ?? '').trim()
  const provider = String(import.meta.env.VITE_AI_PROVIDER ?? '').trim().toLowerCase()
  if (provider !== 'gemini' || !apiKey) return null
  return new GoogleGenAI({ apiKey })
}

function getFrontClient(): AiClient {
  return createFrontAiClient()
}

export async function suggestSkillMapping(jobTitle: string) {
  return suggestSkillMappingUseCase(getFrontClient(), jobTitle)
}

export async function extractSkillMappingFromText(text: string) {
  return extractSkillMappingFromTextUseCase(getFrontClient(), text)
}

export async function challengeProof(activity: string, proof: string) {
  return challengeProofUseCase(getFrontClient(), activity, proof)
}

export async function analyzeExerciseResult(type: string, data: unknown): Promise<string> {
  return analyzeExerciseResultUseCase(getFrontClient(), type, data)
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

  if (client.provider === 'gemini') {
    const ai = getGeminiClient()
    if (!ai) return null

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64File.includes(',') ? base64File.split(',')[1] : base64File,
              mimeType,
            },
          },
          { text: `Analyse ce CV et extrais les informations suivantes de manière structurée. Réponds exclusivement en JSON.` },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            email: { type: Type.STRING },
            currentRole: { type: Type.STRING },
            suggestedTargetRole: { type: Type.STRING },
            summary: { type: Type.STRING },
            skills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  level: { type: Type.NUMBER },
                },
              },
            },
            experiences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  company: { type: Type.STRING },
                  type: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                  isCurrent: { type: Type.BOOLEAN },
                  description: { type: Type.STRING },
                },
              },
            },
            educations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  degree: { type: Type.STRING },
                  school: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                  isCurrent: { type: Type.BOOLEAN },
                  description: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    })

    const text = response.text
    if (!text) return null
    try {
      const data = JSON.parse(text)
      // re-use shared normalisation by going through markdown extractor isn't possible for gemini;
      // so keep minimal normalisation here to match existing UI expectations.
      data.experiences = (data.experiences || []).map((exp: any) => ({
        ...exp,
        id: exp.id || Math.random().toString(36).slice(2, 11),
        isCurrent: !!exp.isCurrent,
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        type: exp.type || 'CDI',
      }))
      data.educations = (data.educations || []).map((edu: any) => ({
        ...edu,
        id: edu.id || Math.random().toString(36).slice(2, 11),
        isCurrent: !!edu.isCurrent,
        startDate: edu.startDate || '',
        endDate: edu.endDate || '',
      }))
      data.skills = (data.skills || []).map((s: any) => ({
        name: s.name,
        level: Math.min(5, Math.max(1, s.level || 3)),
      }))
      return data
    } catch {
      return null
    }
  }

  return null
}

