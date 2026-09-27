import type Employee from '#models/employee'
import type Education from '#models/education'
import type Experience from '#models/experience'
import type Skill from '#models/skill'

/**
 * Profil candidat envoyé au fournisseur IA (Mistral, cf. docs/RGPD.md).
 *
 * Pas de nom ni d'e-mail : le modèle n'en a pas besoin pour analyser un
 * exercice, et un prompt ne doit pas identifier directement la personne.
 */
export interface EmployeeAiProfile {
  currentRole: string
  targetRole: string
  summary: string
  skills: Array<{ name: string; level: number }>
  experiences: Array<{
    title: string
    company: string
    type: string
    startDate: string
    endDate: string
    isCurrent: boolean
    description: string
  }>
  educations: Array<{
    degree: string
    school: string
    startDate: string
    endDate: string
    isCurrent: boolean
    description: string
  }>
}

function toIsoDate(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value?.toISODate === 'function') return value.toISODate() || ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return ''
}

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function clampLevel(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 3
  return Math.min(5, Math.max(1, Math.round(n)))
}

type EmployeeLoaded = Employee & {
  skills?: Array<Skill & { $extras?: { pivot_level?: number } }>
  experiences?: Experience[]
  educations?: Education[]
}

export function buildEmployeeAiProfile(employee: EmployeeLoaded): EmployeeAiProfile {
  const skills = Array.isArray(employee.skills) ? employee.skills : []
  const experiences = Array.isArray(employee.experiences) ? employee.experiences : []
  const educations = Array.isArray(employee.educations) ? employee.educations : []

  return {
    currentRole: toSafeString((employee as any).currentRole),
    targetRole: toSafeString((employee as any).targetRole),
    summary: toSafeString((employee as any).summary),
    skills: skills
      .map((s: any) => ({
        name: toSafeString(s?.name),
        level: clampLevel(s?.$extras?.pivot_level),
      }))
      .filter((s) => s.name),
    experiences: experiences.map((exp: any) => ({
      title: toSafeString(exp?.title),
      company: toSafeString(exp?.company),
      type: toSafeString(exp?.type),
      startDate: toIsoDate(exp?.startDate),
      endDate: toIsoDate(exp?.endDate),
      isCurrent: Boolean(exp?.isCurrent),
      description: toSafeString(exp?.description),
    })),
    educations: educations.map((edu: any) => ({
      degree: toSafeString(edu?.degree),
      school: toSafeString(edu?.school),
      startDate: toIsoDate(edu?.startDate),
      endDate: toIsoDate(edu?.endDate),
      isCurrent: Boolean(edu?.isCurrent),
      description: toSafeString(edu?.description),
    })),
  }
}

/** Remplaçant des identifiants du candidat dans les données envoyées à l'IA. */
export const AI_PSEUDONYM = '[candidat]'

/** Particules de nom qu'on ne remplace pas seules (« des », « van »…). */
const NAME_PARTICLES = new Set(['des', 'del', 'der', 'van', 'von', 'dos', 'das', 'les'])

/** Longueur minimale d'un fragment de nom remplacé seul (évite « Li » dans « Lille »…). */
const MIN_NAME_PART_LENGTH = 3

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Motifs à masquer pour un candidat : e-mail, nom complet puis chaque
 * fragment du nom (prénom, nom de famille), du plus long au plus court pour
 * que « Marie Martin » soit remplacé d'un bloc avant « Marie ».
 */
function identifierPatterns(identity: { name?: string | null; email?: string | null }): RegExp[] {
  const name = (identity.name ?? '').trim()
  const parts = name
    .split(/[\s-]+/)
    .filter((p) => p.length >= MIN_NAME_PART_LENGTH && !NAME_PARTICLES.has(p.toLowerCase()))
  const names = [...new Set([name, ...parts].filter(Boolean))].sort((a, b) => b.length - a.length)
  // L'e-mail d'abord : il contient souvent le prénom, qui sinon serait masqué
  // seul et laisserait le reste de l'adresse lisible.
  const email = identity.email?.trim()
  const unique = email ? [email, ...names] : names

  // Limites de mot Unicode : `\b` ignore les lettres accentuées (« Hélène »).
  return unique.map(
    (term) => new RegExp(`(?<![\\p{L}\\p{N}@.])${escapeRegExp(term)}(?![\\p{L}\\p{N}])`, 'giu')
  )
}

function replaceDeep(value: unknown, patterns: RegExp[]): unknown {
  if (typeof value === 'string') {
    return patterns.reduce((text, pattern) => text.replace(pattern, AI_PSEUDONYM), value)
  }
  if (Array.isArray(value)) return value.map((item) => replaceDeep(item, patterns))
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replaceDeep(item, patterns)])
    )
  }
  return value
}

/**
 * Remplace récursivement, dans toutes les chaînes de `value`, le nom et
 * l'e-mail du candidat par {@link AI_PSEUDONYM}. Le nom est retiré du profil
 * par {@link buildEmployeeAiProfile}, mais il peut réapparaître dans le texte
 * libre (résumé, descriptions, réponses aux exercices).
 */
export function pseudonymizeForAi<T>(
  value: T,
  identity: { name?: string | null; email?: string | null }
): T {
  const patterns = identifierPatterns(identity)
  if (patterns.length === 0) return value
  return replaceDeep(value, patterns) as T
}
