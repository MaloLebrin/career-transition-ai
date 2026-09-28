import { describe, expect, test } from 'vitest'
import {
  AI_PSEUDONYM,
  pseudonymizeForAi,
  type EmployeeAiProfile,
} from '#shared/helpers/ai/exercise_profile'

/**
 * Contrat commun des prompts qualitatifs d'exercice
 * (`shared/helpers/ai/prompts/exercises/*.ts`) : chaque spec de prompt
 * l'appelle avec ce qui est propre à son exercice (titre de section, tâche,
 * titres imposés, données d'exemple).
 */

type PromptInput = { profile: EmployeeAiProfile; exerciseData: unknown }
type PromptBuilder = (input: PromptInput) => string

/** Identité réelle du candidat : ne doit jamais atteindre le fournisseur IA. */
export const CANDIDATE_IDENTITY = {
  name: 'Hélène Dupont-Marchal',
  email: 'helene.dupont@example.com',
}

/** Fragments identifiants à rechercher (insensible à la casse) dans le prompt. */
const IDENTIFYING_FRAGMENTS = ['Hélène', 'Dupont', 'Marchal', 'helene.dupont', 'example.com']

/** Profil brut dont le texte libre contient encore le nom et l'e-mail. */
export function makeLeakyProfile(): EmployeeAiProfile {
  return {
    currentRole: 'Comptable',
    targetRole: 'Data analyst',
    summary: `${CANDIDATE_IDENTITY.name}, comptable depuis 10 ans (${CANDIDATE_IDENTITY.email}).`,
    skills: [
      { name: 'Excel', level: 4 },
      { name: 'SQL', level: 2 },
    ],
    experiences: [
      {
        title: 'Comptable senior',
        company: 'Cabinet Lefèvre',
        type: 'cdi',
        startDate: '2015-01-01',
        endDate: '',
        isCurrent: true,
        description: `Hélène pilote la clôture mensuelle. Contact : ${CANDIDATE_IDENTITY.email}`,
      },
    ],
    educations: [
      {
        degree: 'DCG',
        school: 'IUT de Lille',
        startDate: '2011-09-01',
        endDate: '2014-06-30',
        isCurrent: false,
        description: '',
      },
    ],
  }
}

/** Chaîne d'appel du job d'analyse : profil et données passent par `pseudonymizeForAi`. */
export function pseudonymizedInput(exerciseData: unknown): PromptInput {
  return {
    profile: pseudonymizeForAi(makeLeakyProfile(), CANDIDATE_IDENTITY),
    exerciseData: pseudonymizeForAi(exerciseData, CANDIDATE_IDENTITY),
  }
}

export interface QualitativePromptSpec {
  builder: PromptBuilder
  /** Titre de la section de données, ex. `## Exercice: DISC (données)`. */
  section: string
  /** Phrase de consigne propre à l'exercice (section « Tâche »). */
  task: string
  /** Titres de sections imposés, dans l'ordre (sans la numérotation). */
  headings: string[]
  /** Données d'exercice réalistes ; les chaînes peuvent citer le candidat. */
  exerciseData: Record<string, unknown>
  /** Expert annoncé en tête de prompt (défaut : bilan de compétences). */
  persona?: string
}

export function describeQualitativePrompt(name: string, spec: QualitativePromptSpec): void {
  const persona = spec.persona ?? 'Tu es un coach carrière expert (bilan de compétences).'

  describe(name, () => {
    test('annonce le rôle du modèle en première ligne', () => {
      const prompt = spec.builder(pseudonymizedInput(spec.exerciseData))
      expect(prompt.split('\n')[0]).toBe(persona)
    })

    test('place le profil puis les données de l’exercice sous leurs sections', () => {
      const input = pseudonymizedInput(spec.exerciseData)
      const prompt = spec.builder(input)

      const profileHeader = prompt.indexOf('## Contexte candidat (profil)')
      const profileJson = prompt.indexOf(JSON.stringify(input.profile))
      const dataHeader = prompt.indexOf(spec.section)
      const dataJson = prompt.indexOf(JSON.stringify(input.exerciseData))
      const taskHeader = prompt.indexOf('## Tâche')

      expect(profileHeader).toBeGreaterThanOrEqual(0)
      expect(profileJson).toBeGreaterThan(profileHeader)
      expect(dataHeader).toBeGreaterThan(profileJson)
      expect(dataJson).toBeGreaterThan(dataHeader)
      expect(taskHeader).toBeGreaterThan(dataJson)
    })

    test('contient la consigne propre à l’exercice', () => {
      const prompt = spec.builder(pseudonymizedInput(spec.exerciseData))
      const taskSection = prompt.slice(prompt.indexOf('## Tâche'))
      expect(taskSection).toContain(spec.task)
    })

    test('impose les sections de réponse attendues, numérotées et dans l’ordre', () => {
      const prompt = spec.builder(pseudonymizedInput(spec.exerciseData))
      expect(prompt).toContain(`- ${spec.headings.length} sections obligatoires`)

      let cursor = -1
      spec.headings.forEach((heading, index) => {
        const position = prompt.indexOf(`${index + 1}) ${heading}`)
        expect(position, `section « ${heading} »`).toBeGreaterThan(cursor)
        cursor = position
      })
      expect(prompt).not.toContain(`${spec.headings.length + 1}) `)
    })

    test('borne la longueur de la réponse à 900 caractères', () => {
      const prompt = spec.builder(pseudonymizedInput(spec.exerciseData))
      expect(prompt.trimEnd().endsWith('- Longueur max: 900 caractères.')).toBe(true)
    })

    test('est une fonction pure : même entrée, même prompt, entrée intacte', () => {
      const input = pseudonymizedInput(spec.exerciseData)
      const snapshot = structuredClone(input)
      expect(spec.builder(input)).toBe(spec.builder(input))
      expect(input).toEqual(snapshot)
    })

    test('reflète les données reçues (deux jeux de données, deux prompts)', () => {
      const other = spec.builder(pseudonymizedInput({ marker: 'autre-jeu' }))
      const prompt = spec.builder(pseudonymizedInput(spec.exerciseData))
      expect(other).not.toBe(prompt)
      expect(other).toContain('{"marker":"autre-jeu"}')
    })

    describe('RGPD : aucun nom ni e-mail de candidat', () => {
      test('témoin : sans pseudonymizeForAi, le jeu de test fuiterait l’identité', () => {
        const prompt = spec.builder({
          profile: makeLeakyProfile(),
          exerciseData: spec.exerciseData,
        })
        expect(prompt).toContain(CANDIDATE_IDENTITY.email)
      })

      test('après pseudonymizeForAi, le prompt ne contient plus l’identité', () => {
        const prompt = spec.builder(pseudonymizedInput(spec.exerciseData))
        for (const fragment of IDENTIFYING_FRAGMENTS) {
          expect(prompt.toLowerCase()).not.toContain(fragment.toLowerCase())
        }
        expect(prompt).toContain(AI_PSEUDONYM)
      })

      test('le prompt n’ajoute aucun champ d’identité au profil reçu', () => {
        const prompt = spec.builder(pseudonymizedInput(spec.exerciseData))
        expect(prompt).not.toMatch(/"(email|fullName|firstName|lastName)"\s*:/)
      })

      test('le texte fixe du prompt n’embarque aucune adresse e-mail', () => {
        const prompt = spec.builder({
          profile: pseudonymizeForAi(makeLeakyProfile(), CANDIDATE_IDENTITY),
          exerciseData: null,
        })
        expect(prompt).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/)
      })
    })
  })
}
