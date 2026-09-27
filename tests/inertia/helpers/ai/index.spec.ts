import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AI_ASSIST_ROUTES } from '../../../../shared/constants/ai_assist'
import {
  extractCVData,
  extractSkillMappingFromText,
  suggestTargets,
} from '../../../../inertia/helpers/ai/index'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('helpers IA front (endpoints serveur)', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    document.cookie = 'XSRF-TOKEN=jeton%3Dxsrf'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  test('suggestTargets : POST JSON avec le jeton XSRF décodé', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ companies: ['Acme'], sectors: ['Industrie'] }))
    const profile = { skills: ['SQL'], targetRole: 'Data analyst' }

    expect(await suggestTargets(profile)).toEqual({ companies: ['Acme'], sectors: ['Industrie'] })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(AI_ASSIST_ROUTES.TARGETS)
    expect(init.method).toBe('POST')
    expect(init.credentials).toBe('same-origin')
    expect(init.headers).toMatchObject({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': 'jeton=xsrf',
    })
    expect(JSON.parse(init.body)).toEqual(profile)
  })

  test('extractSkillMappingFromText : renvoie le mapping du serveur', async () => {
    const mapping = [{ mission: 'Clôture', activity: 'Rapprochements', proof: 'Délai' }]
    fetchMock.mockResolvedValue(jsonResponse({ mapping }))

    expect(await extractSkillMappingFromText('récit')).toEqual({ mapping })
    expect(fetchMock.mock.calls[0][0]).toBe(AI_ASSIST_ROUTES.SKILL_MAPPING)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ text: 'récit' })
  })

  test('extractCVData : envoie le fichier en multipart, sans Content-Type forcé', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { name: 'Camille' } }))
    const file = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' })

    expect(await extractCVData(file)).toEqual({ name: 'Camille' })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(AI_ASSIST_ROUTES.CV)
    expect(init.body).toBeInstanceOf(FormData)
    expect((init.body as FormData).get('cv')).toBeInstanceOf(File)
    expect(init.headers).not.toHaveProperty('Content-Type')
  })

  test('résultats vides si le serveur refuse (429, 422…) ou si le réseau échoue', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Trop de requêtes' }, 429))
    expect(await suggestTargets({ skills: [], targetRole: 'x' })).toEqual({
      companies: [],
      sectors: [],
    })

    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    expect(await extractSkillMappingFromText('récit')).toEqual({ mapping: [] })

    fetchMock.mockResolvedValueOnce(jsonResponse({ data: null }))
    expect(await extractCVData(new File(['x'], 'cv.png', { type: 'image/png' }))).toBeNull()
  })

  test('sans cookie XSRF : pas d’en-tête X-XSRF-TOKEN', async () => {
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    fetchMock.mockResolvedValue(jsonResponse({ mapping: [] }))

    await extractSkillMappingFromText('récit')

    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('X-XSRF-TOKEN')
  })

  test('aucun SDK ni clé fournisseur côté navigateur', async () => {
    const source = await import('../../../../inertia/helpers/ai/index.ts?raw')
    expect(source.default).not.toMatch(/mistralai|VITE_MISTRAL|import\.meta\.env/)
  })
})
