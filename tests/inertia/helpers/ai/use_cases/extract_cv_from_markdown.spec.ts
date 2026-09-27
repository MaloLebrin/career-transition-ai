import { describe, expect, test, vi } from 'vitest'
import type { AiClient } from '#shared/helpers/ai/ai_client'
import { buildExtractCvFromMarkdownPrompt } from '#shared/helpers/ai/prompts/extract_cv_from_markdown'
import { extractCvDataFromMarkdown } from '#shared/helpers/ai/use_cases/extract_cv_from_markdown'

function clientReturning(completeJson: AiClient['completeJson']): AiClient {
  return { provider: 'mistral', completeText: async () => null, completeJson }
}

describe('buildExtractCvFromMarkdownPrompt', () => {
  test('inclut le schéma JSON et tronque le markdown à 120 000 caractères', () => {
    const prompt = buildExtractCvFromMarkdownPrompt('# CV\n' + 'a'.repeat(130_000))
    expect(prompt).toContain('"suggestedTargetRole":"string"')
    expect(prompt).toContain('# CV')
    expect(prompt.length).toBeLessThan(121_000)
  })
})

describe('extractCvDataFromMarkdown', () => {
  test('envoie le prompt avec une température basse et normalise la réponse', async () => {
    const completeJson = vi.fn().mockResolvedValue({
      name: 'Camille Martin',
      email: 42,
      currentRole: 'Comptable',
      suggestedTargetRole: 'Data analyst',
      summary: null,
      skills: [
        { name: 'Excel', level: 7 },
        { name: 'SQL' },
        { name: 'Python', level: 'abc' },
        { name: 'Zéro', level: 0 },
        { level: 2 },
      ],
      experiences: [
        {
          id: 'exp-1',
          title: 'Comptable',
          company: 'Fiducial',
          type: 'CDD',
          isCurrent: 1,
          extra: 'conservé',
        },
        { title: 12, startDate: 2020 },
      ],
      educations: [{ degree: 'DCG', school: 'INTEC', startDate: '2014', endDate: '2017' }, {}],
    })

    const result = await extractCvDataFromMarkdown(clientReturning(completeJson), '# CV Camille')

    expect(completeJson).toHaveBeenCalledWith(buildExtractCvFromMarkdownPrompt('# CV Camille'), {
      temperature: 0.2,
    })
    expect(result).toMatchObject({
      name: 'Camille Martin',
      email: '',
      currentRole: 'Comptable',
      suggestedTargetRole: 'Data analyst',
      summary: '',
      skills: [
        { name: 'Excel', level: 5 },
        { name: 'SQL', level: 3 },
        { name: 'Python', level: 3 },
        { name: 'Zéro', level: 3 },
      ],
    })
    expect(result!.experiences[0]).toEqual({
      id: 'exp-1',
      title: 'Comptable',
      company: 'Fiducial',
      type: 'CDD',
      isCurrent: true,
      startDate: '',
      endDate: '',
      description: '',
      extra: 'conservé',
    })
    expect(result!.experiences[1]).toMatchObject({
      title: '',
      type: 'CDI',
      startDate: '',
      isCurrent: false,
    })
    expect(result!.experiences[1].id).toMatch(/^[a-z0-9]+$/)
    expect(result!.educations[0]).toMatchObject({
      degree: 'DCG',
      school: 'INTEC',
      startDate: '2014',
      endDate: '2017',
    })
    expect(result!.educations[1]).toMatchObject({ degree: '', school: '', description: '' })
    expect(result!.educations[1].id).toBeTruthy()
  })

  test('champs de liste absents → tableaux vides', async () => {
    const result = await extractCvDataFromMarkdown(
      clientReturning(async () => ({ name: 'X' }) as never),
      'cv'
    )
    expect(result).toMatchObject({ skills: [], experiences: [], educations: [] })
  })

  test('renvoie null si la réponse est vide, non objet ou en erreur', async () => {
    expect(
      await extractCvDataFromMarkdown(
        clientReturning(async () => null),
        'cv'
      )
    ).toBeNull()
    expect(
      await extractCvDataFromMarkdown(
        clientReturning(async () => 'texte' as never),
        'cv'
      )
    ).toBeNull()
    expect(
      await extractCvDataFromMarkdown(
        clientReturning(async () => {
          throw new Error('timeout')
        }),
        'cv'
      )
    ).toBeNull()
  })
})
