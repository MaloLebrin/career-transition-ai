import { AI_ASSIST_ROUTES } from '../../../shared/constants/ai_assist'
import type { ExtractedCvData } from '../../../shared/helpers/ai/use_cases/extract_cv_from_markdown'
import type { ExtractedSkillMappingRow } from '../../../shared/helpers/ai/use_cases/extract_skill_mapping'

/**
 * Assistance IA côté navigateur : simples appels aux endpoints serveur
 * (`AiAssistController`). Aucune clé ni SDK fournisseur dans le bundle.
 * Toute erreur (IA désactivée, quota, réseau) donne un résultat vide.
 */

/** Jeton du cookie `XSRF-TOKEN` posé par shield, attendu en `X-XSRF-TOKEN`. */
function xsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

async function postAi<T>(url: string, body: FormData | Record<string, unknown>): Promise<T | null> {
  const isForm = body instanceof FormData
  const token = xsrfToken()
  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { 'X-XSRF-TOKEN': token } : {}),
      },
      body: isForm ? body : JSON.stringify(body),
    })
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}

export async function extractSkillMappingFromText(
  text: string
): Promise<{ mapping: ExtractedSkillMappingRow[] }> {
  const result = await postAi<{ mapping?: ExtractedSkillMappingRow[] }>(
    AI_ASSIST_ROUTES.SKILL_MAPPING,
    { text }
  )
  return { mapping: Array.isArray(result?.mapping) ? result.mapping : [] }
}

export async function suggestTargets(profile: {
  skills: string[]
  targetRole: string
}): Promise<{ companies: string[]; sectors: string[] }> {
  const result = await postAi<{ companies?: string[]; sectors?: string[] }>(
    AI_ASSIST_ROUTES.TARGETS,
    profile
  )
  return {
    companies: Array.isArray(result?.companies) ? result.companies : [],
    sectors: Array.isArray(result?.sectors) ? result.sectors : [],
  }
}

/** Envoie le fichier du CV (multipart) ; `null` si rien n'a pu être extrait. */
export async function extractCVData(file: File): Promise<ExtractedCvData | null> {
  const form = new FormData()
  form.append('cv', file)
  const result = await postAi<{ data?: ExtractedCvData | null }>(AI_ASSIST_ROUTES.CV, form)
  return result?.data ?? null
}
