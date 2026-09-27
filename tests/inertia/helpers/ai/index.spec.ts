import { beforeEach, describe, expect, test, vi } from 'vitest'

const deps = vi.hoisted(() => ({
  client: {} as Record<string, unknown>,
  extractCvDataFromMarkdown: vi.fn(),
  extractSkillMappingFromText: vi.fn(),
  suggestTargets: vi.fn(),
}))

vi.mock('../../../../inertia/helpers/ai/front_ai_client', () => ({
  createFrontAiClient: () => deps.client,
}))
vi.mock('../../../../shared/helpers/ai/use_cases/extract_cv_from_markdown', () => ({
  extractCvDataFromMarkdown: deps.extractCvDataFromMarkdown,
}))
vi.mock('../../../../shared/helpers/ai/use_cases/extract_skill_mapping', () => ({
  extractSkillMappingFromText: deps.extractSkillMappingFromText,
}))
vi.mock('../../../../shared/helpers/ai/use_cases/suggest_targets', () => ({
  suggestTargets: deps.suggestTargets,
}))

import {
  extractCVData,
  extractSkillMappingFromText,
  suggestTargets,
} from '../../../../inertia/helpers/ai/index'

describe('helpers IA front', () => {
  beforeEach(() => {
    deps.client = { provider: 'none' }
    vi.clearAllMocks()
  })

  test('extractSkillMappingFromText et suggestTargets délèguent aux cas d’usage avec le client front', async () => {
    deps.extractSkillMappingFromText.mockResolvedValue({ rows: [] })
    deps.suggestTargets.mockResolvedValue({ companies: ['Acme'], sectors: [] })

    expect(await extractSkillMappingFromText('texte')).toEqual({ rows: [] })
    expect(deps.extractSkillMappingFromText).toHaveBeenCalledWith(deps.client, 'texte')

    const profile = { skills: ['SQL'], targetRole: 'Data analyst' }
    expect(await suggestTargets(profile)).toEqual({ companies: ['Acme'], sectors: [] })
    expect(deps.suggestTargets).toHaveBeenCalledWith(deps.client, profile)
  })

  test('extractCVData : null sans fournisseur mistral ou sans OCR', async () => {
    expect(await extractCVData('data:application/pdf;base64,QUJD', 'application/pdf')).toBeNull()
    deps.client = { provider: 'mistral' }
    expect(await extractCVData('QUJD', 'application/pdf')).toBeNull()
    expect(deps.extractCvDataFromMarkdown).not.toHaveBeenCalled()
  })

  test('extractCVData : OCR sur le base64 sans préfixe data-URL puis extraction', async () => {
    const ocrToMarkdown = vi.fn().mockResolvedValue('# CV')
    deps.client = { provider: 'mistral', ocrToMarkdown }
    deps.extractCvDataFromMarkdown.mockResolvedValue({ name: 'Camille' })

    expect(await extractCVData('data:application/pdf;base64,QUJD', 'application/pdf')).toEqual({
      name: 'Camille',
    })
    expect(ocrToMarkdown).toHaveBeenCalledWith({ base64: 'QUJD', mimeType: 'application/pdf' })
    expect(deps.extractCvDataFromMarkdown).toHaveBeenCalledWith(deps.client, '# CV')

    await extractCVData('RAW64', 'image/png')
    expect(ocrToMarkdown).toHaveBeenLastCalledWith({ base64: 'RAW64', mimeType: 'image/png' })
  })

  test('extractCVData : OCR vide → null', async () => {
    deps.client = { provider: 'mistral', ocrToMarkdown: vi.fn().mockResolvedValue(null) }
    expect(await extractCVData('QUJD', 'image/png')).toBeNull()
    expect(deps.extractCvDataFromMarkdown).not.toHaveBeenCalled()
  })
})
