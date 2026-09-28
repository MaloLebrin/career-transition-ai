import { describe, expect, test } from 'vitest'
import type { AiClient } from '#shared/helpers/ai/ai_client'
import { SUBPROCESSORS } from '#shared/constants/legal'
import { buildExtractCvFromMarkdownPrompt } from '#shared/helpers/ai/prompts/extract_cv_from_markdown'
import { extractCvDataFromMarkdown } from '#shared/helpers/ai/use_cases/extract_cv_from_markdown'

const MARKER = 'CV markdown OCR:\n'

/** Schéma JSON d'exemple que le prompt demande au modèle de respecter. */
function schemaFromPrompt(prompt: string): Record<string, unknown> {
  const start = prompt.indexOf('{')
  const end = prompt.lastIndexOf('}', prompt.indexOf(MARKER))
  return JSON.parse(prompt.slice(start, end + 1))
}

describe('buildExtractCvFromMarkdownPrompt', () => {
  test('place le CV OCRisé après le schéma, tel quel', () => {
    const markdown = '# Hélène Dupont\n\n## Expériences\n- Comptable, Cabinet Lefèvre'
    const prompt = buildExtractCvFromMarkdownPrompt(markdown)
    expect(prompt.endsWith(`${MARKER}${markdown}`)).toBe(true)
  })

  test('exige une extraction fidèle en JSON, sans invention', () => {
    const prompt = buildExtractCvFromMarkdownPrompt('x')
    expect(prompt).toContain("pas d'invention")
    expect(prompt).toContain('chaîne vide ou un tableau vide')
    expect(prompt).toContain('Réponds exclusivement en JSON')
  })

  test('le schéma demandé est du JSON valide couvrant tous les champs extraits', () => {
    const schema = schemaFromPrompt(buildExtractCvFromMarkdownPrompt(''))
    expect(Object.keys(schema).sort()).toEqual(
      [
        'currentRole',
        'educations',
        'email',
        'experiences',
        'name',
        'skills',
        'suggestedTargetRole',
        'summary',
      ].sort()
    )
  })

  test('le schéma est compris tel quel par le use case (clés alignées)', async () => {
    const schema = schemaFromPrompt(buildExtractCvFromMarkdownPrompt(''))
    const client: AiClient = {
      provider: 'none',
      completeText: async () => null,
      completeJson: async <T>() => schema as T,
    }
    const result = await extractCvDataFromMarkdown(client, '')
    expect(result).not.toBeNull()
    expect(Object.keys(result!).sort()).toEqual(Object.keys(schema).sort())
    expect(result!.skills).toEqual([{ name: 'string', level: 3 }])
    expect(result!.experiences[0]).toMatchObject({ title: 'string', type: 'CDI' })
    expect(result!.educations[0]).toMatchObject({ degree: 'string', school: 'string' })
  })

  test('tronque le CV à 120 000 caractères', () => {
    const markdown = 'a'.repeat(120_000) + 'QUEUE_TRONQUEE'
    const prompt = buildExtractCvFromMarkdownPrompt(markdown)
    const embedded = prompt.slice(prompt.indexOf(MARKER) + MARKER.length)
    expect(embedded).toHaveLength(120_000)
    expect(prompt).not.toContain('QUEUE_TRONQUEE')
  })

  test('RGPD : l’envoi du CV brut (nom, e-mail) est bien déclaré aux personnes', () => {
    // Le CV importé n'est pas pseudonymisé (il sert à pré-remplir nom et
    // e-mail) : la page /confidentialite doit le dire.
    const mistral = SUBPROCESSORS.find((s) => s.name === 'Mistral AI')
    expect(mistral?.purpose).toMatch(/CV importé est transmis tel quel/)
  })
})
