import type { AiClient } from '#shared/helpers/ai/ai_client'
import { buildExtractCvFromMarkdownPrompt } from '#shared/helpers/ai/prompts/extract_cv_from_markdown'

export interface ExtractedCvData {
  name: string
  email: string
  currentRole: string
  suggestedTargetRole: string
  summary: string
  skills: Array<{ name: string; level: number }>
  experiences: Array<{
    id: string
    title: string
    company: string
    type: string
    startDate: string
    endDate: string
    isCurrent: boolean
    description: string
  }>
  educations: Array<{
    id: string
    degree: string
    school: string
    startDate: string
    endDate: string
    isCurrent: boolean
    description: string
  }>
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 11)
}

export async function extractCvDataFromMarkdown(
  client: AiClient,
  markdown: string
): Promise<ExtractedCvData | null> {
  const prompt = buildExtractCvFromMarkdownPrompt(markdown)
  try {
    const data = await client.completeJson<any>(prompt, { temperature: 0.2 })
    if (!data || typeof data !== 'object') return null

    const experiences = Array.isArray(data.experiences) ? data.experiences : []
    const educations = Array.isArray(data.educations) ? data.educations : []
    const skills = Array.isArray(data.skills) ? data.skills : []

    return {
      name: typeof data.name === 'string' ? data.name : '',
      email: typeof data.email === 'string' ? data.email : '',
      currentRole: typeof data.currentRole === 'string' ? data.currentRole : '',
      suggestedTargetRole:
        typeof data.suggestedTargetRole === 'string' ? data.suggestedTargetRole : '',
      summary: typeof data.summary === 'string' ? data.summary : '',
      experiences: experiences.map((exp: any) => ({
        ...exp,
        id: typeof exp?.id === 'string' && exp.id ? exp.id : randomId(),
        isCurrent: !!exp?.isCurrent,
        startDate: typeof exp?.startDate === 'string' ? exp.startDate : '',
        endDate: typeof exp?.endDate === 'string' ? exp.endDate : '',
        type: typeof exp?.type === 'string' && exp.type ? exp.type : 'CDI',
        title: typeof exp?.title === 'string' ? exp.title : '',
        company: typeof exp?.company === 'string' ? exp.company : '',
        description: typeof exp?.description === 'string' ? exp.description : '',
      })),
      educations: educations.map((edu: any) => ({
        ...edu,
        id: typeof edu?.id === 'string' && edu.id ? edu.id : randomId(),
        isCurrent: !!edu?.isCurrent,
        startDate: typeof edu?.startDate === 'string' ? edu.startDate : '',
        endDate: typeof edu?.endDate === 'string' ? edu.endDate : '',
        degree: typeof edu?.degree === 'string' ? edu.degree : '',
        school: typeof edu?.school === 'string' ? edu.school : '',
        description: typeof edu?.description === 'string' ? edu.description : '',
      })),
      skills: skills
        .map((s: any) => ({
          name: typeof s?.name === 'string' ? s.name : '',
          level: Math.min(5, Math.max(1, Number(s?.level ?? 3) || 3)),
        }))
        .filter((s: any) => s.name),
    }
  } catch {
    return null
  }
}
